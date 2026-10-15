import { type Ledger, now } from '../ledger.ts'

/** The fingerprints of the approved documents of each item. */
export class ApprovalStore {
  constructor(private readonly ledger: Ledger) {}

  hashes(item: string): Map<string, string> {
    const rows = this.ledger.all<{ document: string; hash: string }>(
      'SELECT document, hash FROM approval WHERE item = ?',
      item,
    )
    return new Map(rows.map(r => [r.document, r.hash]))
  }

  store(item: string, document: string, hash: string): void {
    this.ledger.run(
      'INSERT INTO approval (item, document, hash, at) VALUES (?, ?, ?, ?) ON CONFLICT(item, document) DO UPDATE SET hash = excluded.hash, at = excluded.at',
      item,
      document,
      hash,
      now(),
    )
  }

  clear(item: string): void {
    this.ledger.run('DELETE FROM approval WHERE item = ?', item)
  }
}
