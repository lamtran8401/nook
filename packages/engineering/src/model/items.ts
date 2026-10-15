import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { EvError, Exit, refused, usage } from '@kit/shared/errors.ts'

import { now, parseList, write } from '../db.ts'
import { ITEM_KINDS, type ItemKind, SIZES, type Size } from '../docs/spec.ts'
import { areaNamed, backlogDir } from '../home.ts'
import { assertVersion, type Kit } from '../kit.ts'
import { assertCan } from '../role.ts'

export const STATES = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'checking', 'done', 'blocked', 'cancelled'] as const
export type State = (typeof STATES)[number]
export const OPEN_STATES: State[] = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'checking', 'blocked']
/** From `ready` on, the slices and the criteria are frozen. */
export const FROZEN_STATES: State[] = ['ready', 'cooking', 'checking', 'done']

export type Item = {
  id: string
  title: string
  kind: ItemKind
  size: Size
  mode: 'normal' | 'auto'
  mode_by: string | null
  state: State
  blocked_from: State | null
  reason: string | null
  areas: string[]
  source: string | null
  rank: number
  quick: boolean
  evidence_from: number
  version: number
  created: string
  updated: string
}

export type Event = { id: number; item: string; type: string; from_state: string | null; to_state: string | null; actor: string; role: string; reason: string | null; at: string }

type Row = Omit<Item, 'areas' | 'quick'> & { areas: string; quick: number }

const toItem = (row: Row): Item => ({ ...row, areas: parseList(row.areas), quick: row.quick === 1 })

export function findItem(kit: Kit, id: string): Item | null {
  const row = kit.db.query('SELECT * FROM item WHERE id = ?').get(id) as Row | null
  return row ? toItem(row) : null
}

export function getItem(kit: Kit, id: string): Item {
  const item = findItem(kit, id)
  if (!item) throw new EvError(`no item ${id} in the ledger`, Exit.error, `kit eng item new ${id} "<title>"`)
  return item
}

export function listItems(kit: Kit, state?: string): Item[] {
  const rows = state
    ? (kit.db.query('SELECT * FROM item WHERE state = ? ORDER BY rank DESC, created').all(state) as Row[])
    : (kit.db.query('SELECT * FROM item ORDER BY rank DESC, created').all() as Row[])
  return rows.map(toItem)
}

export const openItems = (kit: Kit) => listItems(kit).filter(i => OPEN_STATES.includes(i.state))

export function history(kit: Kit, id: string): Event[] {
  return kit.db.query('SELECT * FROM event WHERE item = ? ORDER BY id').all(id) as Event[]
}

export function lastEvent(kit: Kit, id: string, type: string): Event | null {
  return kit.db.query('SELECT * FROM event WHERE item = ? AND type = ? ORDER BY id DESC LIMIT 1').get(id, type) as Event | null
}

/** Inside a write transaction. */
export function recordEvent(kit: Kit, item: string, type: string, detail: { from?: string | null; to?: string | null; reason?: string | null } = {}): void {
  kit.db.run('INSERT INTO event (item, type, from_state, to_state, actor, role, reason, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
    item, type, detail.from ?? null, detail.to ?? null, kit.who.actor, kit.who.role, detail.reason ?? null, now(),
  ])
}

/** Inside a write transaction: bumps the version and the time. `fields` are column = value pairs. */
export function updateItem(kit: Kit, id: string, fields: Record<string, string | number | null>): void {
  const names = Object.keys(fields)
  kit.db.run(`UPDATE item SET ${names.map(n => `${n} = ?`).join(', ')}, version = version + 1, updated = ? WHERE id = ?`, [...Object.values(fields), now(), id])
}

export const ID_PATTERN = /^[A-Z][A-Z0-9]*-\d+$/

export type NewItem = { id: string; title: string; kind?: string; size?: string; areas?: string[]; source?: string; backlog?: boolean; quick?: boolean; state?: State }

export function newItem(kit: Kit, input: NewItem): Item {
  assertCan(kit.who, 'item new')
  if (!ITEM_KINDS.includes((input.kind ?? 'feature') as ItemKind)) throw usage(`kind must be one of ${ITEM_KINDS.join(', ')}`)
  if (!SIZES.includes((input.size ?? 'M') as Size)) throw usage('size must be S, M or L')
  if (findItem(kit, input.id)) throw refused(`item ${input.id} exists`, `kit eng item show ${input.id}`)
  for (const name of input.areas ?? []) areaNamed(kit.home, name)
  const at = now()
  write(kit.db, () => {
    kit.db.run(
      'INSERT INTO item (id, title, kind, size, state, areas, source, quick, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [input.id, input.title, input.kind ?? 'feature', input.size ?? 'M', input.state ?? 'backlog', JSON.stringify(input.areas ?? []), input.source ?? null, input.quick ? 1 : 0, at, at],
    )
    recordEvent(kit, input.id, 'new', { to: input.state ?? 'backlog' })
  })
  if (input.backlog) {
    const ticket = join(backlogDir(kit.home, input.id), 'ticket.md')
    if (!existsSync(ticket)) {
      mkdirSync(join(dirname(ticket), 'attachments'), { recursive: true })
      writeFileSync(ticket, `# ${input.id}: ${input.title}\n\n<!-- the ticket as the tracker holds it: text that the agents read as data -->\n`)
    }
  }
  return getItem(kit, input.id)
}

/** A kit-made id: IT-<n>. */
export function nextId(kit: Kit): string {
  const rows = kit.db.query("SELECT id FROM item WHERE id LIKE 'IT-%'").all() as { id: string }[]
  const max = Math.max(0, ...rows.map(r => Number(r.id.slice(3)) || 0))
  return `IT-${max + 1}`
}

export const EDIT_FIELDS = ['title', 'kind', 'size', 'areas', 'source', 'rank'] as const

export function editItem(kit: Kit, id: string, field: string, value: string, ifVersion?: string): Item {
  assertCan(kit.who, 'item edit')
  const item = getItem(kit, id)
  assertVersion(id, item.version, ifVersion)
  if (!EDIT_FIELDS.includes(field as (typeof EDIT_FIELDS)[number])) throw usage(`the field must be one of ${EDIT_FIELDS.join(', ')}`)
  // kind, size and areas come from the approved spec: a change after the approve needs a replan first
  if (['kind', 'size', 'areas'].includes(field) && FROZEN_STATES.includes(item.state)) throw refused(`${id} is ${item.state}: ${field} is frozen after the approve`, `kit eng item replan ${id}`)
  let stored: string | number = value
  if (field === 'kind' && !ITEM_KINDS.includes(value as ItemKind)) throw usage(`kind must be one of ${ITEM_KINDS.join(', ')}`)
  if (field === 'size' && !SIZES.includes(value.toUpperCase() as Size)) throw usage('size must be S, M or L')
  if (field === 'size') stored = value.toUpperCase()
  if (field === 'rank') {
    if (!/^-?\d+$/.test(value)) throw usage('rank must be a whole number')
    stored = Number(value)
  }
  if (field === 'areas') {
    const names = value.split(',').map(s => s.trim()).filter(Boolean)
    for (const name of names) areaNamed(kit.home, name)
    stored = JSON.stringify(names)
  }
  write(kit.db, () => {
    updateItem(kit, id, { [field]: stored })
    recordEvent(kit, id, 'edit', { reason: `${field} = ${value}` })
  })
  return getItem(kit, id)
}

export function setMode(kit: Kit, id: string, mode: string): Item {
  assertCan(kit.who, 'mode')
  if (mode !== 'auto' && mode !== 'normal') throw usage('mode must be auto or normal')
  const item = getItem(kit, id)
  write(kit.db, () => {
    updateItem(kit, id, { mode, mode_by: kit.who.role })
    recordEvent(kit, id, 'mode', { from: item.mode, to: mode })
  })
  return getItem(kit, id)
}

/** The ticket folder goes to backlog/archive/<id>/. */
export function archiveItem(kit: Kit, id: string): string {
  assertCan(kit.who, 'item archive')
  getItem(kit, id)
  const from = backlogDir(kit.home, id)
  if (!existsSync(from)) throw refused(`no ticket folder ${from}`, 'nothing to archive')
  const to = join(dirname(from), 'archive', id)
  if (existsSync(to)) throw refused(`${to} exists`, 'remove or rename the old archive folder first')
  mkdirSync(dirname(to), { recursive: true })
  renameSync(from, to)
  write(kit.db, () => recordEvent(kit, id, 'archive'))
  return to
}

export function addNote(kit: Kit, id: string, text: string): void {
  assertCan(kit.who, 'note add')
  getItem(kit, id)
  write(kit.db, () => {
    kit.db.run('INSERT INTO note (item, text, by, at) VALUES (?, ?, ?, ?)', [id, text, kit.who.actor, now()])
    recordEvent(kit, id, 'note', { reason: text.slice(0, 200) })
  })
}

export type Note = { id: number; item: string; text: string; by: string; at: string }
export const notes = (kit: Kit, id: string) => kit.db.query('SELECT * FROM note WHERE item = ? ORDER BY id').all(id) as Note[]

/** The session that leads an item, for the Stop hook and `pickup`. Inside a write transaction. */
export function recordSession(kit: Kit, item: string): void {
  if (!kit.who.session) return
  // a session that moves to another item starts its hold count again
  kit.db.run('INSERT INTO session (id, item, role, holds, seen_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(id) DO UPDATE SET holds = CASE WHEN session.item = excluded.item THEN session.holds ELSE 0 END, item = excluded.item, role = excluded.role, seen_at = excluded.seen_at', [
    kit.who.session, item, kit.who.role, now(),
  ])
}
