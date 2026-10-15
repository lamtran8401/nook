import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The three documents that the approve fingerprints. */
export type WorkDoc = 'spec.md' | 'plan.md' | 'tasks.md'
export type ItemDoc = WorkDoc | 'findings.md' | 'handoff.md' | 'walkthrough.md'

/** The documents of one item in `<home>/work/<id>/`. */
export class WorkFolder {
  constructor(readonly dir: string) {}

  path(doc: ItemDoc): string {
    return join(this.dir, doc)
  }

  read(doc: ItemDoc): string | null {
    const file = this.path(doc)
    return existsSync(file) ? readFileSync(file, 'utf8') : null
  }

  /** The SHA-256 of a document, or `missing`. */
  hash(doc: ItemDoc): string {
    const text = this.read(doc)
    return text === null ? 'missing' : createHash('sha256').update(text).digest('hex')
  }
}
