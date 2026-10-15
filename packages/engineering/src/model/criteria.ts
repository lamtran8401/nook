import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { refused, usage } from '@kit/shared/errors.ts'

import { now, write } from '../db.ts'
import { TAGS, type Tag } from '../docs/spec.ts'
import { workDir } from '../home.ts'
import type { Kit } from '../kit.ts'
import { assertCan } from '../role.ts'
import { FROZEN_STATES, getItem, recordEvent } from './items.ts'

/** The acceptance criteria of an item. The ledger holds the text as it was when the mark was made. */

export const GRADES = ['run', 'sourced', 'judged', 'owner'] as const
export type Grade = (typeof GRADES)[number]

export type Criterion = { item: string; n: number; text: string; done: boolean; evidence: string | null; grade: Grade | null; by: string | null; at: string | null }

type Row = Omit<Criterion, 'done'> & { done: number }

export function criteria(kit: Kit, id: string): Criterion[] {
  const rows = kit.db.query('SELECT * FROM criterion WHERE item = ? ORDER BY n').all(id) as Row[]
  return rows.map(row => ({ ...row, done: row.done === 1 }))
}

/**
 * Puts the AC lines of the spec into the ledger. A mark stays when its text is equal; a mark on a changed text is
 * cleared and named in the result. Inside a write transaction.
 */
export function syncCriteria(kit: Kit, id: string, lines: string[]): { cleared: number[] } {
  const before = new Map(criteria(kit, id).map(c => [c.n, c]))
  const cleared: number[] = []
  kit.db.run('DELETE FROM criterion WHERE item = ?', [id])
  lines.forEach((text, i) => {
    const n = i + 1
    const old = before.get(n)
    const keep = old?.done && old.text === text
    if (old?.done && !keep) cleared.push(n)
    kit.db.run('INSERT INTO criterion (item, n, text, done, evidence, grade, by, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      id, n, text, keep ? 1 : 0, keep ? old.evidence : null, keep ? old.grade : null, keep ? old.by : null, keep ? old.at : null,
    ])
  })
  for (const n of cleared) recordEvent(kit, id, 'ac', { reason: `AC ${n}: the mark was cleared, its text changed` })
  return { cleared }
}

export function addCriterion(kit: Kit, id: string, text: string, tag = 'ADD'): Criterion {
  assertCan(kit.who, 'item ac add')
  const item = getItem(kit, id)
  if (!TAGS.includes(tag as Tag)) throw usage(`the tag must be one of ${TAGS.join(', ')}`)
  if (FROZEN_STATES.includes(item.state) && !item.quick) throw refused(`${id} is ${item.state}: the criteria are frozen after the approve`, `kit eng item replan ${id}`)
  const line = `[${tag}] ${text.trim()}`
  const n = criteria(kit, id).length + 1
  write(kit.db, () => {
    kit.db.run('INSERT INTO criterion (item, n, text, done) VALUES (?, ?, ?, 0)', [id, n, line])
    recordEvent(kit, id, 'ac', { reason: `AC ${n} added: ${line}` })
  })
  appendToSpec(kit, id, line)
  return criteria(kit, id)[n - 1]!
}

/** The spec stays the source: a new line goes under its criteria heading when the file exists. */
function appendToSpec(kit: Kit, id: string, line: string): void {
  const file = join(workDir(kit.home, id), 'spec.md')
  if (!existsSync(file)) return
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  const start = lines.findIndex(l => /^##\s+acceptance criteria/i.test(l))
  if (start < 0) return
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l))
  if (end < 0) end = lines.length
  while (end > start + 1 && !lines[end - 1]!.trim()) end--
  lines.splice(end, 0, `- ${line}`)
  writeFileSync(file, lines.join('\n'))
}

export function markCriterion(kit: Kit, id: string, n: number, evidence: string, grade: string): Criterion {
  assertCan(kit.who, 'item ac done')
  getItem(kit, id)
  if (!GRADES.includes(grade as Grade)) throw usage(`the grade must be one of ${GRADES.join(', ')}`)
  if (!evidence.trim()) throw usage('give the evidence: what shows that the criterion is met')
  const found = criteria(kit, id).find(c => c.n === n)
  if (!found) throw usage(`${id} has no AC ${n}`, `kit eng item ac list ${id}`)
  write(kit.db, () => {
    kit.db.run('UPDATE criterion SET done = 1, evidence = ?, grade = ?, by = ?, at = ? WHERE item = ? AND n = ?', [evidence.trim(), grade, kit.who.actor, now(), id, n])
    recordEvent(kit, id, 'ac', { reason: `AC ${n} done (${grade}): ${evidence.trim().slice(0, 200)}` })
  })
  return criteria(kit, id).find(c => c.n === n)!
}

export function unmarkCriterion(kit: Kit, id: string, n: number): Criterion {
  assertCan(kit.who, 'item ac done')
  getItem(kit, id)
  const found = criteria(kit, id).find(c => c.n === n)
  if (!found) throw usage(`${id} has no AC ${n}`, `kit eng item ac list ${id}`)
  write(kit.db, () => {
    kit.db.run('UPDATE criterion SET done = 0, evidence = NULL, grade = NULL, by = NULL, at = NULL WHERE item = ? AND n = ?', [id, n])
    recordEvent(kit, id, 'ac', { reason: `AC ${n} undone` })
  })
  return criteria(kit, id).find(c => c.n === n)!
}
