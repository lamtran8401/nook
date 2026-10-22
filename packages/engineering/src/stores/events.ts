import { type Ledger, now } from '../ledger.ts'
import type { Who } from '../who.ts'

export type Event = {
  id: number
  item: string
  type: string
  from_state: string | null
  to_state: string | null
  actor: string
  role: string
  reason: string | null
  at: string
}

export type EventDetail = { from?: string | null; to?: string | null; reason?: string | null }

export class EventStore {
  constructor(
    private readonly ledger: Ledger,
    private readonly who: Who,
  ) {}

  record(item: string, type: string, detail: EventDetail = {}): void {
    this.ledger.run(
      'INSERT INTO event (item, type, from_state, to_state, actor, role, reason, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      item,
      type,
      detail.from ?? null,
      detail.to ?? null,
      this.who.actor,
      this.who.role,
      detail.reason ?? null,
      now(),
    )
  }

  history(item: string): Event[] {
    return this.ledger.all<Event>('SELECT * FROM event WHERE item = ? ORDER BY id', item)
  }

  /** The events of every item from `at` on, the newest first. */
  since(at: string): Event[] {
    return this.ledger.all<Event>('SELECT * FROM event WHERE at >= ? ORDER BY id DESC', at)
  }

  last(item: string, type: string): Event | null {
    return this.ledger.get<Event>(
      'SELECT * FROM event WHERE item = ? AND type = ? ORDER BY id DESC LIMIT 1',
      item,
      type,
    )
  }

  count(item: string, type: string): number {
    return (
      this.ledger.get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM event WHERE item = ? AND type = ?',
        item,
        type,
      )?.n ?? 0
    )
  }
}
