import { type Ledger, now } from '../ledger.ts'
import type { ItemKind } from '../vocabulary.ts'

/** The kind of each ticket type that the workspace learned, such as Sub-Bug → fix, whatever tracker wrote the ticket. */
export type TypeKind = { type: string; kind: ItemKind }

export class TypeKindStore {
  constructor(private readonly ledger: Ledger) {}

  list(): TypeKind[] {
    return this.ledger.all<TypeKind>('SELECT type, kind FROM type_kind ORDER BY type')
  }

  kindOf(type: string): ItemKind | null {
    return this.ledger.get<{ kind: ItemKind }>('SELECT kind FROM type_kind WHERE type = ?', type)?.kind ?? null
  }

  set(type: string, kind: ItemKind, by: string): void {
    this.ledger.run(
      'INSERT INTO type_kind (type, kind, by, at) VALUES (?, ?, ?, ?) ON CONFLICT (type) DO UPDATE SET kind = excluded.kind, by = excluded.by, at = excluded.at',
      type,
      kind,
      by,
      now(),
    )
  }
}
