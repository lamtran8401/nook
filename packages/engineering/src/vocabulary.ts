/** The closed sets of values of the ledger columns and the document fields (docs/reference/engineering.md 5, 6). */

export const ITEM_KINDS = ['feature', 'fix', 'chore', 'investigate'] as const
export type ItemKind = (typeof ITEM_KINDS)[number]

export const SIZES = ['S', 'M', 'L'] as const
export type Size = (typeof SIZES)[number]

export const TAGS = ['ADD', 'CHANGE', 'REMOVE', 'NONE'] as const
export type Tag = (typeof TAGS)[number]

export const GRADES = ['run', 'sourced', 'judged', 'owner'] as const
export type Grade = (typeof GRADES)[number]

export const IMPACTS = ['low', 'med', 'high'] as const
export type Impact = (typeof IMPACTS)[number]

export const PROOFS = ['none', 'proven', 'weak', 'skipped'] as const
export type Proof = (typeof PROOFS)[number]

export const MODES = ['normal', 'yolo'] as const
export type Mode = (typeof MODES)[number]

export const isOneOf = <T extends string>(values: readonly T[], value: string | undefined): value is T =>
  value !== undefined && (values as readonly string[]).includes(value)
