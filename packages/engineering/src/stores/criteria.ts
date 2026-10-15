import { type Ledger, now } from '../ledger.ts'
import type { Grade } from '../vocabulary.ts'

/** The acceptance criteria of an item. A mark holds the text of the criterion as it was when it was made. */

export type Criterion = {
  item: string
  n: number
  text: string
  done: boolean
  evidence: string | null
  grade: Grade | null
  by: string | null
  at: string | null
}

type Row = Omit<Criterion, 'done'> & { done: number }

export class CriterionStore {
  constructor(private readonly ledger: Ledger) {}

  list(item: string): Criterion[] {
    return this.ledger
      .all<Row>('SELECT * FROM criterion WHERE item = ? ORDER BY n', item)
      .map(row => ({ ...row, done: row.done === 1 }))
  }

  find(item: string, n: number): Criterion | undefined {
    return this.list(item).find(c => c.n === n)
  }

  /** Replaces the criteria with `lines`; a mark stays on an equal text. Returns the cleared numbers. */
  sync(item: string, lines: string[]): number[] {
    const before = new Map(this.list(item).map(c => [c.n, c]))
    const cleared: number[] = []
    this.ledger.run('DELETE FROM criterion WHERE item = ?', item)
    lines.forEach((text, i) => {
      const n = i + 1
      const old = before.get(n)
      const keep = old?.done && old.text === text ? old : null
      if (old?.done && !keep) cleared.push(n)
      this.ledger.run(
        'INSERT INTO criterion (item, n, text, done, evidence, grade, by, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        item,
        n,
        text,
        keep ? 1 : 0,
        keep?.evidence ?? null,
        keep?.grade ?? null,
        keep?.by ?? null,
        keep?.at ?? null,
      )
    })
    return cleared
  }

  add(item: string, n: number, text: string): void {
    this.ledger.run('INSERT INTO criterion (item, n, text, done) VALUES (?, ?, ?, 0)', item, n, text)
  }

  mark(item: string, n: number, evidence: string, grade: Grade, by: string): void {
    this.ledger.run(
      'UPDATE criterion SET done = 1, evidence = ?, grade = ?, by = ?, at = ? WHERE item = ? AND n = ?',
      evidence,
      grade,
      by,
      now(),
      item,
      n,
    )
  }

  unmark(item: string, n: number): void {
    this.ledger.run(
      'UPDATE criterion SET done = 0, evidence = NULL, grade = NULL, by = NULL, at = NULL WHERE item = ? AND n = ?',
      item,
      n,
    )
  }
}
