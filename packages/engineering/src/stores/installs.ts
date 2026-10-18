import type { Ledger } from '../ledger.ts'

/** The last good install of each area: the hash of its lockfile then. */
export class InstallStore {
  constructor(private readonly ledger: Ledger) {}

  lastLock(area: string): string | null {
    return this.ledger.get<{ lock: string }>('SELECT lock FROM area_install WHERE area = ?', area)?.lock ?? null
  }

  record(area: string, lock: string, at: string): void {
    this.ledger.run(
      'INSERT INTO area_install (area, lock, at) VALUES (?, ?, ?) ON CONFLICT (area) DO UPDATE SET lock = excluded.lock, at = excluded.at',
      area,
      lock,
      at,
    )
  }
}
