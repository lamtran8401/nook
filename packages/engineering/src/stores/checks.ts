import type { Ledger } from '../ledger.ts'

/** The rows of `item verify`: one for each check of each area. */

export type CheckResult = 'pass' | 'fail'
export type CheckRun = {
  id: number
  item: string
  area: string
  check: string
  result: CheckResult
  output: string
  at: string
}
export type CheckOutcome = Pick<CheckRun, 'area' | 'check' | 'result' | 'output'>

type Watermarked = { id: string; evidence_from: number }

export class CheckStore {
  constructor(private readonly ledger: Ledger) {}

  insert(item: string, outcomes: CheckOutcome[], at: string): void {
    for (const r of outcomes) {
      this.ledger.run(
        'INSERT INTO check_run (item, area, "check", result, output, at) VALUES (?, ?, ?, ?, ?, ?)',
        item,
        r.area,
        r.check,
        r.result,
        r.output,
        at,
      )
    }
  }

  /** The rows of the last run after the watermark of the item: the rows that share the last `at`. */
  lastRun(item: Watermarked): CheckRun[] {
    const last = this.ledger.get<{ at: string }>(
      'SELECT at FROM check_run WHERE item = ? AND id > ? ORDER BY id DESC LIMIT 1',
      item.id,
      item.evidence_from,
    )
    if (!last) return []
    return this.ledger.all<CheckRun>(
      'SELECT * FROM check_run WHERE item = ? AND at = ? ORDER BY id',
      item.id,
      last.at,
    )
  }

  /** The time of the last run after the watermark when every check passed, else null. */
  verifiedAt(item: Watermarked): string | null {
    const run = this.lastRun(item)
    return run.length && run.every(r => r.result === 'pass') ? run[0]!.at : null
  }

  /** The id of the newest row of every item: the watermark that a move back sets. */
  lastId(): number {
    return this.ledger.get<{ id: number }>('SELECT COALESCE(MAX(id), 0) AS id FROM check_run')?.id ?? 0
  }
}
