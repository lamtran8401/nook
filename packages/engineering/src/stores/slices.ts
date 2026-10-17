import { EvError, Exit } from '@nook/shared/errors.ts'

import type { SliceSpec } from '../documents/tasks.ts'
import { type Ledger, parseList, parseNumbers } from '../ledger.ts'
import type { SliceState, State } from '../machine.ts'
import type { Proof } from '../vocabulary.ts'

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
  proof: Proof
  proof_note: string | null
  version: number
}

export type RunningSlice = Slice & { itemState: State }

type Row = Omit<Slice, 'depends' | 'acs' | 'files'> & { depends: string; acs: string; files: string }

const toSlice = (row: Row): Slice => ({
  ...row,
  depends: parseList(row.depends),
  acs: parseNumbers(row.acs),
  files: parseList(row.files),
})
const byNumber = (a: { id: string }, b: { id: string }) => Number(a.id.slice(1)) - Number(b.id.slice(1))

/** `proof: none (reason)` in tasks.md marks a slice whose proof is skipped. */
export const skipsProof = (spec: SliceSpec) => spec.proof !== null && /^none\b/i.test(spec.proof)

/** The proof line of a todo slice as the file sets it; a started slice owns its proof, so the file no longer sets it. */
const skipNote = (slice: Slice) => (slice.proof === 'skipped' ? slice.proof_note : null)

/** True when the ledger slice equals the file slice in every field that the file holds. */
export function sameAsSpec(slice: Slice, spec: SliceSpec): boolean {
  return (
    slice.title === spec.title &&
    slice.area === spec.area &&
    slice.size === spec.size &&
    JSON.stringify(slice.depends) === JSON.stringify(spec.depends) &&
    JSON.stringify(slice.acs) === JSON.stringify(spec.acs) &&
    (slice.state !== 'todo' || skipNote(slice) === (skipsProof(spec) ? spec.proof : null))
  )
}

export type SliceChange = {
  state: SliceState
  assignee: string | null
  reason: string | null
  files: string[]
}

export class SliceStore {
  constructor(private readonly ledger: Ledger) {}

  list(item: string): Slice[] {
    return this.ledger.all<Row>('SELECT * FROM slice WHERE item = ?', item).map(toSlice).sort(byNumber)
  }

  /** Every slice that is not cancelled. */
  live(item: string): Slice[] {
    return this.list(item).filter(s => s.state !== 'cancelled')
  }

  find(item: string, id: string): Slice | null {
    const row = this.ledger.get<Row>('SELECT * FROM slice WHERE item = ? AND id = ?', item, id.toUpperCase())
    return row ? toSlice(row) : null
  }

  get(item: string, id: string): Slice {
    const slice = this.find(item, id)
    if (!slice) throw new EvError(`${item} has no slice ${id}`, Exit.error, `nook eng task list ${item}`)
    return slice
  }

  /** The todo slices whose dependencies are done. */
  ready(item: string): Slice[] {
    const all = this.live(item)
    const done = this.doneIds(item)
    return all.filter(s => s.state === 'todo' && s.depends.every(d => done.has(d)))
  }

  doneIds(item: string): Set<string> {
    return new Set(
      this.list(item)
        .filter(s => s.state === 'done')
        .map(s => s.id),
    )
  }

  running(): RunningSlice[] {
    const rows = this.ledger.all<Row & { itemState: State }>(
      "SELECT s.*, i.state AS itemState FROM slice s JOIN item i ON i.id = s.item WHERE s.state = 'running'",
    )
    return rows.map(row => ({ ...toSlice(row), itemState: row.itemState }))
  }

  ids(item: string): Set<string> {
    return new Set(
      this.ledger.all<{ id: string }>('SELECT id FROM slice WHERE item = ?', item).map(s => s.id),
    )
  }

  insert(item: string, spec: SliceSpec): void {
    const skipped = skipsProof(spec)
    this.ledger.run(
      'INSERT INTO slice (item, id, title, area, depends, acs, size, state, proof, proof_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      item,
      spec.id,
      spec.title,
      spec.area,
      JSON.stringify(spec.depends),
      JSON.stringify(spec.acs),
      spec.size,
      'todo',
      skipped ? 'skipped' : 'none',
      skipped ? spec.proof : null,
    )
  }

  /** The slice follows the file again and goes back to todo. */
  /** A started slice takes a new title, depends, criteria and size; its state, area, files and proof stay. */
  describe(item: string, spec: SliceSpec): void {
    this.ledger.run(
      'UPDATE slice SET title = ?, depends = ?, acs = ?, size = ?, version = version + 1 WHERE item = ? AND id = ?',
      spec.title,
      JSON.stringify(spec.depends),
      JSON.stringify(spec.acs),
      spec.size,
      item,
      spec.id,
    )
  }

  replace(item: string, spec: SliceSpec): void {
    const skipped = skipsProof(spec)
    this.ledger.run(
      "UPDATE slice SET title = ?, area = ?, depends = ?, acs = ?, size = ?, state = 'todo', reason = NULL, proof = ?, proof_note = ?, version = version + 1 WHERE item = ? AND id = ?",
      spec.title,
      spec.area,
      JSON.stringify(spec.depends),
      JSON.stringify(spec.acs),
      spec.size,
      skipped ? 'skipped' : 'none',
      skipped ? spec.proof : null,
      item,
      spec.id,
    )
  }

  insertRunning(item: string, title: string, area: string, assignee: string): void {
    this.ledger.run(
      "INSERT INTO slice (item, id, title, area, state, assignee) VALUES (?, 'T1', ?, ?, 'running', ?)",
      item,
      title,
      area,
      assignee,
    )
  }

  cancel(item: string, id: string, reason: string): void {
    this.ledger.run(
      "UPDATE slice SET state = 'cancelled', reason = ?, version = version + 1 WHERE item = ? AND id = ?",
      reason,
      item,
      id,
    )
  }

  change(item: string, id: string, change: SliceChange): void {
    this.ledger.run(
      'UPDATE slice SET state = ?, assignee = ?, reason = ?, files = ?, version = version + 1 WHERE item = ? AND id = ?',
      change.state,
      change.assignee,
      change.reason,
      JSON.stringify(change.files),
      item,
      id,
    )
  }

  resetToTodo(item: string, id: string, reason: string): void {
    this.ledger.run(
      "UPDATE slice SET state = 'todo', assignee = NULL, reason = ?, version = version + 1 WHERE item = ? AND id = ?",
      reason,
      item,
      id,
    )
  }

  recordProof(item: string, id: string, proof: Proof, note: string): void {
    this.ledger.run(
      'UPDATE slice SET proof = ?, proof_note = ?, version = version + 1 WHERE item = ? AND id = ?',
      proof,
      note,
      item,
      id,
    )
  }
}
