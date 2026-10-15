import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit, refused, usage } from '@kit/shared/errors.ts'

import { parseList, parseNumbers, write } from '../db.ts'
import { parseTasks, type SliceSpec } from '../docs/tasks.ts'
import { workDir } from '../home.ts'
import { assertVersion, type Kit } from '../kit.ts'
import { type Action, assertCan, assertOwnSlice } from '../role.ts'
import { FROZEN_STATES, getItem, type Item, recordEvent } from './items.ts'

/** The slices of an item: `todo → running ⇄ waiting → done`; `running | waiting → failed → todo`; `done → running`. */

export const SLICE_STATES = ['todo', 'running', 'waiting', 'done', 'failed', 'cancelled'] as const
export type SliceState = (typeof SLICE_STATES)[number]
export const PROOFS = ['none', 'proven', 'weak', 'skipped'] as const

export type Slice = {
  item: string
  id: string
  title: string
  area: string
  depends: string[]
  acs: number[]
  size: string | null
  state: SliceState
  assignee: string | null
  reason: string | null
  files: string[]
  proof: (typeof PROOFS)[number]
  proof_note: string | null
  version: number
}

type Row = Omit<Slice, 'depends' | 'acs' | 'files'> & { depends: string; acs: string; files: string }
const toSlice = (row: Row): Slice => ({ ...row, depends: parseList(row.depends), acs: parseNumbers(row.acs), files: parseList(row.files) })

const byNumber = (a: { id: string }, b: { id: string }) => Number(a.id.slice(1)) - Number(b.id.slice(1))

export function slices(kit: Kit, id: string): Slice[] {
  const rows = kit.db.query('SELECT * FROM slice WHERE item = ?').all(id) as Row[]
  return rows.map(toSlice).sort(byNumber)
}

export const liveSlices = (kit: Kit, id: string) => slices(kit, id).filter(s => s.state !== 'cancelled')

export function getSlice(kit: Kit, id: string, sliceId: string): Slice {
  const row = kit.db.query('SELECT * FROM slice WHERE item = ? AND id = ?').get(id, sliceId.toUpperCase()) as Row | null
  if (!row) throw new EvError(`${id} has no slice ${sliceId}`, Exit.error, `kit eng task list ${id}`)
  return toSlice(row)
}

/** The slices whose dependencies are done and that wait to start. */
export function readySlices(kit: Kit, id: string): Slice[] {
  const all = liveSlices(kit, id)
  const done = new Set(all.filter(s => s.state === 'done').map(s => s.id))
  return all.filter(s => s.state === 'todo' && s.depends.every(d => done.has(d)))
}

/** Every slice of every item in cooking with state `running`, for the hooks. */
export function runningSlices(kit: Kit): (Slice & { itemState: string })[] {
  const rows = kit.db.query("SELECT s.*, i.state AS itemState FROM slice s JOIN item i ON i.id = s.item WHERE s.state = 'running'").all() as (Row & { itemState: string })[]
  return rows.map(row => ({ ...toSlice(row), itemState: row.itemState }))
}

export function readTasksFile(kit: Kit, id: string): string | null {
  const file = join(workDir(kit.home, id), 'tasks.md')
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

export type ImportReport = { created: string[]; updated: string[]; cancelled: string[]; kept: string[] }

/** tasks.md into the ledger, by slice id: new slices are made, todo slices follow the file, started ones stay. */
export function importTasks(kit: Kit, id: string): ImportReport {
  assertCan(kit.who, 'task import')
  const item = getItem(kit, id)
  if (FROZEN_STATES.includes(item.state)) throw refused(`${id} is ${item.state}: the slices are frozen after the approve`, `replan first: kit eng item replan ${id}`)
  const text = readTasksFile(kit, id)
  if (text === null) throw refused(`${workDir(kit.home, id)}/tasks.md is missing`, `kit eng item agree ${id} scaffolds it`)
  const parsed = parseTasks(text)
  if (parsed.problems.length) throw refused(`tasks.md has gaps:\n${parsed.problems.map(p => `  - ${p}`).join('\n')}`, `fix the lines in ${workDir(kit.home, id)}/tasks.md`)
  const report: ImportReport = { created: [], updated: [], cancelled: [], kept: [] }
  write(kit.db, () => {
    const have = new Map(slices(kit, id).map(s => [s.id, s]))
    for (const spec of parsed.slices) {
      const old = have.get(spec.id)
      if (!old) {
        kit.db.run('INSERT INTO slice (item, id, title, area, depends, acs, size, state, proof, proof_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
          id, spec.id, spec.title, spec.area, JSON.stringify(spec.depends), JSON.stringify(spec.acs), spec.size, 'todo', skipped(spec) ? 'skipped' : 'none', skipped(spec) ? spec.proof : null,
        ])
        report.created.push(spec.id)
      } else if (old.state === 'todo' || old.state === 'cancelled') {
        if (same(old, spec) && old.state === 'todo') continue
        kit.db.run("UPDATE slice SET title = ?, area = ?, depends = ?, acs = ?, size = ?, state = 'todo', reason = NULL, proof = ?, proof_note = ?, version = version + 1 WHERE item = ? AND id = ?", [
          spec.title, spec.area, JSON.stringify(spec.depends), JSON.stringify(spec.acs), spec.size, skipped(spec) ? 'skipped' : 'none', skipped(spec) ? spec.proof : null, id, spec.id,
        ])
        report.updated.push(spec.id)
      } else report.kept.push(`${spec.id} (${old.state})`)
    }
    const inFile = new Set(parsed.slices.map(s => s.id))
    for (const old of have.values()) {
      if (inFile.has(old.id) || old.state === 'cancelled') continue
      if (old.state === 'todo') {
        kit.db.run("UPDATE slice SET state = 'cancelled', reason = 'removed from tasks.md', version = version + 1 WHERE item = ? AND id = ?", [id, old.id])
        report.cancelled.push(old.id)
      } else report.kept.push(`${old.id} (${old.state}, not in tasks.md)`)
    }
    recordEvent(kit, id, 'import', { reason: `slices: +${report.created.length} ~${report.updated.length} -${report.cancelled.length}` })
  })
  return report
}

const skipped = (spec: SliceSpec) => spec.proof !== null && /^none\b/i.test(spec.proof)

/** True when the ledger slice equals the file slice in every field that the file holds. */
export function same(slice: Slice, spec: SliceSpec): boolean {
  return slice.title === spec.title && slice.area === spec.area && slice.size === spec.size &&
    JSON.stringify(slice.depends) === JSON.stringify(spec.depends) && JSON.stringify(slice.acs) === JSON.stringify(spec.acs)
}

type TaskMove = { action: Action; from: SliceState[]; to: SliceState; reason?: boolean; own?: boolean }

export const TASK_MOVES: Record<string, TaskMove> = {
  start: { action: 'task start', from: ['todo'], to: 'running', own: true },
  done: { action: 'task done', from: ['running'], to: 'done', own: true },
  wait: { action: 'task wait', from: ['running'], to: 'waiting', reason: true, own: true },
  resume: { action: 'task resume', from: ['waiting'], to: 'running', own: true },
  fail: { action: 'task fail', from: ['running', 'waiting'], to: 'failed', reason: true, own: true },
  retry: { action: 'task retry', from: ['failed'], to: 'todo' },
  reopen: { action: 'task reopen', from: ['done'], to: 'running', reason: true },
  cancel: { action: 'task cancel', from: ['todo', 'running', 'waiting', 'failed'], to: 'cancelled', reason: true },
}

export type TaskMoveInput = { reason?: string; files?: string[]; ifVersion?: string }

export function moveSlice(kit: Kit, name: string, id: string, sliceId: string, input: TaskMoveInput = {}): Slice {
  const move = TASK_MOVES[name]
  if (!move) throw usage(`no task move is named ${name}`, `moves: ${Object.keys(TASK_MOVES).join(', ')}`)
  assertCan(kit.who, move.action)
  const item = getItem(kit, id)
  const slice = getSlice(kit, id, sliceId)
  assertVersion(`${id} ${slice.id}`, slice.version, input.ifVersion)
  // a builder works on its own slice; a todo slice has no owner yet, so start takes it
  if (move.own && slice.state !== 'todo') assertOwnSlice(kit.who, slice.assignee, slice.id)
  if (!move.from.includes(slice.state)) throw refused(`${slice.id} is ${slice.state}: ${name} needs ${move.from.join(' or ')}`, `kit eng task show ${id} ${slice.id}`)
  if (move.reason && !input.reason?.trim()) throw usage(`${name} needs --reason`)
  if (name === 'start' || name === 'reopen' || name === 'resume') startGaps(kit, item, slice)
  const assignee = move.to === 'running' ? (name === 'start' || !slice.assignee ? kit.who.actor : slice.assignee) : move.to === 'todo' ? null : slice.assignee
  const files = input.files?.length ? [...new Set([...slice.files, ...input.files])] : slice.files
  write(kit.db, () => {
    kit.db.run('UPDATE slice SET state = ?, assignee = ?, reason = ?, files = ?, version = version + 1 WHERE item = ? AND id = ?', [
      move.to, assignee, input.reason?.trim() ?? null, JSON.stringify(files), id, slice.id,
    ])
    recordEvent(kit, id, 'task', { from: slice.state, to: move.to, reason: `${slice.id} ${name}${input.reason ? `: ${input.reason}` : ''}` })
  })
  return getSlice(kit, id, slice.id)
}

/** A slice starts only when the item is in cooking and every slice in `depends` is done. */
function startGaps(kit: Kit, item: Item, slice: Slice): void {
  if (item.state !== 'cooking') throw refused(`${item.id} is ${item.state}: a slice starts only in cooking`, `kit eng next ${item.id}`)
  const done = new Set(slices(kit, item.id).filter(s => s.state === 'done').map(s => s.id))
  const waiting = slice.depends.filter(d => !done.has(d))
  if (waiting.length) throw refused(`${slice.id} depends on ${waiting.join(', ')}, not done yet`, `kit eng task list ${item.id} --ready`)
}

/** Inside a write transaction, from `task prove`. */
export function recordProof(kit: Kit, id: string, sliceId: string, proof: Slice['proof'], note: string): void {
  kit.db.run('UPDATE slice SET proof = ?, proof_note = ?, version = version + 1 WHERE item = ? AND id = ?', [proof, note, id, sliceId])
  recordEvent(kit, id, 'prove', { reason: `${sliceId} ${proof}: ${note.slice(0, 200)}` })
}
