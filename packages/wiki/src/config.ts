import { usage } from '@nook/shared/errors.ts'

/** The `wiki` section of nook.yml: where the wiki and the references live, and the shelves with their use. */

export type Shelf = {
  name: string
  /** What the shelf holds, in one sentence; the top index shows it. */
  use: string
  /** False for a shelf such as `daily/`, whose pages get no line in an index. */
  index: boolean
}

type Raw = Record<string, unknown>

const text = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value.trim() : fallback)

export class WikiConfig {
  private constructor(
    readonly dir: string,
    readonly references: string,
    /** Where a page goes when a combined page replaces it, relative to the desk. */
    readonly archive: string,
    readonly shelves: Shelf[],
    readonly missing: boolean,
  ) {}

  static from(section: unknown): WikiConfig {
    if (section === undefined || section === null) return new WikiConfig('docs/wiki', 'docs/references', 'archive/wiki', [], true)
    if (typeof section !== 'object' || Array.isArray(section)) throw usage('nook.yml: wiki must be a map of keys')
    const raw = section as Raw
    const shelves = Array.isArray(raw.shelves) ? raw.shelves.map(shelfOf) : []
    return new WikiConfig(text(raw.dir, 'docs/wiki'), text(raw.references, 'docs/references'), text(raw.archive, 'archive/wiki'), shelves, false)
  }
}

function shelfOf(value: unknown): Shelf {
  const raw = (typeof value === 'string' ? { name: value } : value) as Raw
  const name = text(raw?.name, '')
  if (!name) throw usage('nook.yml: each shelf of wiki needs a name', 'write shelves as - { name: ideas, use: "..." }')
  return { name, use: text(raw.use, ''), index: raw.index !== false }
}
