import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { refused, usage } from '@kit/shared/errors.ts'

import { now, write } from '../db.ts'
import { parseSpec } from '../docs/spec.ts'
import { areaNamed, workDir } from '../home.ts'
import { assertVersion, type Kit } from '../kit.ts'
import { type Action, assertCan } from '../role.ts'
import { lastCheckId } from './checks.ts'
import { syncCriteria } from './criteria.ts'
import { DOCS, formatGaps, gaps, hashOf, proofWarnings, readDoc } from './guards.ts'
import { getItem, ID_PATTERN, type Item, listItems, newItem, nextId, OPEN_STATES, recordEvent, recordSession, type State, updateItem } from './items.ts'

/** The moves of an item (docs/engineering.md section 4). */

export type Move = { from: State[]; to: State | 'blocked_from'; action: Action; reason?: boolean; back?: boolean }

const OPEN_NOT_BLOCKED = OPEN_STATES.filter(s => s !== 'blocked')

export const MOVES: Record<string, Move> = {
  start: { from: ['backlog'], to: 'framing', action: 'move' },
  agree: { from: ['framing'], to: 'planning', action: 'move' },
  approve: { from: ['planning'], to: 'ready', action: 'approve' },
  proceed: { from: ['planning'], to: 'ready', action: 'proceed' },
  begin: { from: ['ready'], to: 'cooking', action: 'move' },
  submit: { from: ['cooking'], to: 'checking', action: 'move' },
  accept: { from: ['checking'], to: 'done', action: 'accept' },
  reject: { from: ['checking'], to: 'cooking', action: 'move', reason: true, back: true },
  replan: { from: ['ready', 'cooking', 'checking'], to: 'planning', action: 'move', reason: true, back: true },
  reframe: { from: ['planning', 'ready', 'cooking', 'checking'], to: 'framing', action: 'move', reason: true, back: true },
  reopen: { from: ['done'], to: 'cooking', action: 'move', reason: true, back: true },
  block: { from: OPEN_NOT_BLOCKED, to: 'blocked', action: 'move', reason: true },
  unblock: { from: ['blocked'], to: 'blocked_from', action: 'move' },
  cancel: { from: OPEN_STATES, to: 'cancelled', action: 'move', reason: true },
  restore: { from: ['cancelled'], to: 'backlog', action: 'move', back: true },
}

export const MOVE_NAMES = Object.keys(MOVES)

export type MoveResult = { item: Item; warnings: string[]; notes: string[] }

export function moveItem(kit: Kit, name: string, id: string, input: { reason?: string; ifVersion?: string } = {}): MoveResult {
  const move = MOVES[name]
  if (!move) throw usage(`no move is named ${name}`, `moves: ${MOVE_NAMES.join(', ')}`)
  assertCan(kit.who, move.action)
  const item = getItem(kit, id)
  assertVersion(id, item.version, input.ifVersion)
  if (!move.from.includes(item.state)) throw refused(`${id} is ${item.state}: ${name} needs ${move.from.join(' or ')}`, `kit eng next ${id}`)
  if (move.reason && !input.reason?.trim()) throw usage(`${name} needs --reason "<why>"`)
  const found = gaps(kit, item, name)
  if (found.length) throw refused(`${name} ${id}: ${found.length} gap${found.length > 1 ? 's' : ''}\n${formatGaps(found)}`, found[0]!.fix)
  const to = move.to === 'blocked_from' ? (item.blocked_from ?? 'backlog') : move.to
  const warnings = name === 'submit' ? proofWarnings(kit, item) : []
  const notes: string[] = []
  if (name === 'start') notes.push(...scaffold(kit, item, 'spec.md'))
  write(kit.db, () => {
    const fields: Record<string, string | number | null> = { state: to, reason: input.reason?.trim() ?? null }
    if (name === 'block') fields.blocked_from = item.state
    if (name === 'unblock') fields.blocked_from = null
    if (name === 'agree' || name === 'approve' || name === 'proceed') Object.assign(fields, fromSpec(kit, item, notes))
    if (name === 'approve' || name === 'proceed') storeFingerprints(kit, id)
    if (move.back) {
      kit.db.run('DELETE FROM approval WHERE item = ?', [id])
      fields.evidence_from = lastCheckId(kit)
    }
    updateItem(kit, id, fields)
    recordEvent(kit, id, name, { from: item.state, to, reason: input.reason?.trim() ?? null })
    if (kit.who.role === 'lead') recordSession(kit, id)
  })
  if (name === 'agree') notes.push(...scaffold(kit, item, 'plan.md'), ...scaffold(kit, item, 'tasks.md'))
  return { item: getItem(kit, id), warnings, notes }
}

/** The spec is the source of kind, size, areas and the criteria. Inside a write transaction. */
function fromSpec(kit: Kit, item: Item, notes: string[]): Record<string, string> {
  const text = readDoc(kit, item.id, 'spec.md')
  if (text === null) return {}
  const spec = parseSpec(text)
  const { cleared } = syncCriteria(kit, item.id, spec.criteria.map(c => c.text))
  if (cleared.length) notes.push(`marks cleared, the text changed: AC ${cleared.join(', AC ')}`)
  const fields: Record<string, string> = { areas: JSON.stringify(spec.areas) }
  if (spec.kind) fields.kind = spec.kind
  if (spec.size) fields.size = spec.size
  return fields
}

function storeFingerprints(kit: Kit, id: string): void {
  const at = now()
  for (const doc of DOCS) {
    kit.db.run('INSERT INTO approval (item, document, hash, at) VALUES (?, ?, ?, ?) ON CONFLICT(item, document) DO UPDATE SET hash = excluded.hash, at = excluded.at', [id, doc, hashOf(readDoc(kit, id, doc)), at])
  }
}

const TEMPLATES = join(import.meta.dir, '..', '..', 'templates')

/** Writes a document from its template when it does not exist yet. */
export function scaffold(kit: Kit, item: Item, doc: 'spec.md' | 'plan.md' | 'tasks.md' | 'findings.md' | 'handoff.md'): string[] {
  const dir = workDir(kit.home, item.id)
  const file = join(dir, doc)
  if (existsSync(file)) return []
  mkdirSync(dir, { recursive: true })
  writeFileSync(file, fillTemplate(readFileSync(join(TEMPLATES, doc), 'utf8'), item))
  return [`wrote ${file}`]
}

/** `quick`: an item in cooking with one running slice for the caller, no spec and no plan. */
export function quickItem(kit: Kit, idOrTitle: string, area: string): Item {
  assertCan(kit.who, 'quick')
  const isId = ID_PATTERN.test(idOrTitle)
  const id = isId ? idOrTitle : nextId(kit)
  const title = isId ? idOrTitle : idOrTitle
  const found = areaNamed(kit.home, area)
  const other = listItems(kit, 'cooking').find(i => i.areas.includes(found.name))
  if (other) throw refused(`area ${found.name} is in use by ${other.id}`, `wait for ${other.id}, or pick another area`)
  newItem(kit, { id, title, kind: 'fix', size: 'S', areas: [found.name], quick: true, state: 'cooking' })
  write(kit.db, () => {
    kit.db.run("INSERT INTO slice (item, id, title, area, state, assignee) VALUES (?, 'T1', ?, ?, 'running', ?)", [id, title, found.name, kit.who.actor])
    recordEvent(kit, id, 'quick', { to: 'cooking', reason: `T1 running in ${found.name}` })
    if (kit.who.role === 'lead') recordSession(kit, id)
  })
  return getItem(kit, id)
}

export function fillTemplate(template: string, item: Item): string {
  let text = template
    .replaceAll('{{id}}', item.id)
    .replaceAll('{{title}}', item.title)
    .replaceAll('{{kind}}', item.kind)
    .replaceAll('{{size}}', item.size)
    .replaceAll('{{areas}}', `[${item.areas.join(', ')}]`)
  // an investigation asks questions in place of criteria
  if (item.kind === 'investigate') {
    text = text.replace(/## Acceptance criteria\n[\s\S]*?(?=\n## |$)/, '## Questions\n\n<!-- one `- question` line each; findings.md answers them with evidence -->\n')
  }
  return text
}
