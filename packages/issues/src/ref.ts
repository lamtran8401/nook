import { usage } from '@nook/shared/errors.ts'

import type { GitHubSource, IssuesConfig } from './config.ts'

/** A ticket that a desk can pull: its source, the id of the item it makes, and its number there. */
export type Ref = { source: GitHubSource; key: string; number: number }

const REPO_REF = /^([\w.-]+\/[\w.-]+)#(\d+)$/
const KEY_REF = /^([A-Z][A-Z0-9]*)-(\d+)$/

/** `GH-482` by the prefix of a source, or `acme/shop#482` by its repo. */
export function resolveRef(ref: string, config: IssuesConfig): Ref {
  const github = config.sources.filter((s): s is GitHubSource => s.type === 'github')
  const byRepo = REPO_REF.exec(ref)
  const byKey = KEY_REF.exec(ref)
  const source = byRepo ? github.find(s => s.repo === byRepo[1]) : byKey ? github.find(s => s.prefix === byKey[1]) : undefined
  if (source) return { source, key: `${source.prefix}-${Number((byRepo ?? byKey)![2])}`, number: Number((byRepo ?? byKey)![2]) }
  const example = github[0] ?? { prefix: 'GH', repo: 'acme/shop' }
  throw usage(`${ref} names no source of this desk`, `use a prefix such as ${example.prefix}-482 or a repo of issue-tracker.sources, such as ${example.repo}#482`)
}
