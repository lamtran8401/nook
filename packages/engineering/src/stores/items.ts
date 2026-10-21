import { EvError, Exit } from '@nook/shared/errors.ts'

import { type Ledger, now, type Param, parseList } from '../ledger.ts'
import { isOpen, type State } from '../machine.ts'
import type { ItemKind, Mode, Size } from '../vocabulary.ts'

export type Item = {
  id: string
  title: string
  kind: ItemKind
  size: Size
  mode: Mode
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
  /** The root cause type of a fix, kept at its submit. */
  root_cause: string | null
  /** The item that this one belongs to, such as the story of a sub-bug. */
  parent: string | null
  /** The story points of the ticket, when the tracker has them; the size S, M or L stays in the spec. */
  points: number | null
  created: string
  updated: string
}

export type ItemRow = {
  id: string
  title: string
  kind: string
  size: string
  state: State
  areas: string[]
  source: string | null
  quick: boolean
  parent?: string | null
  points?: number | null
}

type Row = Omit<Item, 'areas' | 'quick'> & { areas: string; quick: number }

const toItem = (row: Row): Item => ({ ...row, areas: parseList(row.areas), quick: row.quick === 1 })

export class ItemStore {
  constructor(private readonly ledger: Ledger) {}

  find(id: string): Item | null {
    const row = this.ledger.get<Row>('SELECT * FROM item WHERE id = ?', id)
    return row ? toItem(row) : null
  }

  get(id: string): Item {
    const item = this.find(id)
    if (!item)
      throw new EvError(`no item ${id} in the ledger`, Exit.error, `nook eng item new ${id} "<title>"`)
    return item
  }

  list(state?: string): Item[] {
    const rows = state
      ? this.ledger.all<Row>('SELECT * FROM item WHERE state = ? ORDER BY rank DESC, created', state)
      : this.ledger.all<Row>('SELECT * FROM item ORDER BY rank DESC, created')
    return rows.map(toItem)
  }

  open(): Item[] {
    return this.list().filter(i => isOpen(i.state))
  }

  /** The items whose parent is `id`, in the order they came. */
  children(id: string): Item[] {
    return this.ledger.all<Row>('SELECT * FROM item WHERE parent = ? ORDER BY created', id).map(toItem)
  }

  /** The item in cooking that uses an area, other than `except`. */
  cookingIn(area: string, except?: string): Item | undefined {
    return this.list('cooking').find(other => other.id !== except && other.areas.includes(area))
  }

  insert(row: ItemRow): void {
    const at = now()
    this.ledger.run(
      'INSERT INTO item (id, title, kind, size, state, areas, source, quick, parent, points, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      row.id,
      row.title,
      row.kind,
      row.size,
      row.state,
      JSON.stringify(row.areas),
      row.source,
      row.quick ? 1 : 0,
      row.parent ?? null,
      row.points ?? null,
      at,
      at,
    )
  }

  /** Sets the columns, and moves the version and the time. */
  update(id: string, fields: Record<string, Param>): void {
    const names = Object.keys(fields)
    const set = names.map(n => `${n} = ?`).join(', ')
    this.ledger.run(
      `UPDATE item SET ${set}, version = version + 1, updated = ? WHERE id = ?`,
      ...Object.values(fields),
      now(),
      id,
    )
  }

  /** A nook-made id: one more than the highest IT number, three digits at least (IT-001, IT-1000). */
  nextId(): string {
    const rows = this.ledger.all<{ id: string }>("SELECT id FROM item WHERE id LIKE 'IT-%'")
    const numbers = rows.map(r => /^IT-(\d+)$/.exec(r.id)?.[1]).filter(n => n !== undefined)
    const max = Math.max(0, ...numbers.map(Number))
    return `IT-${String(max + 1).padStart(3, '0')}`
  }
}
