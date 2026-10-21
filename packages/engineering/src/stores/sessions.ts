import { type Ledger, now } from '../ledger.ts'
import type { Who } from '../who.ts'

/** The session that leads each item, and how many times the Stop hook held it. */
export class SessionStore {
  constructor(
    private readonly ledger: Ledger,
    private readonly who: Who,
  ) {}

  /** The caller's session leads `item`; a move is progress, so it starts the hold count again. */
  record(item: string, role: string = this.who.role): void {
    if (!this.who.session) return
    this.ledger.run(
      'INSERT INTO session (id, item, role, holds, seen_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(id) DO UPDATE SET holds = 0, item = excluded.item, role = excluded.role, seen_at = excluded.seen_at',
      this.who.session,
      item,
      role,
      now(),
    )
  }

  itemOf(session: string): string | null {
    return this.ledger.get<{ item: string }>('SELECT item FROM session WHERE id = ?', session)?.item ?? null
  }

  /** Adds the session for `item` when it has no row; keeps a row that exists. */
  ensure(session: string, item: string): void {
    this.ledger.run(
      'INSERT INTO session (id, item, role, holds, seen_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(id) DO NOTHING',
      session,
      item,
      'lead',
      now(),
    )
  }

  holds(session: string): number {
    return this.ledger.get<{ holds: number }>('SELECT holds FROM session WHERE id = ?', session)?.holds ?? 0
  }

  /** The session that touched `item` last; a hold is not a touch, so a held session does not stay the lead. */
  leaderOf(item: string): string | null {
    return this.ledger.get<{ id: string }>('SELECT id FROM session WHERE item = ? ORDER BY seen_at DESC, rowid DESC LIMIT 1', item)?.id ?? null
  }

  setHolds(session: string, holds: number): void {
    this.ledger.run('UPDATE session SET holds = ? WHERE id = ?', holds, session)
  }

  resetHolds(session: string): void {
    this.ledger.run('UPDATE session SET holds = 0 WHERE id = ?', session)
  }
}
