import { usage } from '@nook/shared/errors.ts'

import type { GitHubSource, IssuesConfig, JiraSource } from './config.ts'

/** A ticket that a desk can pull: its source, the id of the item it makes, and for GitHub its number. */
export type Ref = { source: GitHubSource; key: string; number: number } | { source: JiraSource; key: string }

const REPO_REF = /^([\w.-]+\/[\w.-]+)#(\d+)$/
const KEY_REF = /^([A-Z][A-Z0-9]*)-(\d+)$/

/** The Jira site of a key: the only one, or the one whose map names its project. */
function jiraOf(key: string, project: string, sites: JiraSource[]): JiraSource | undefined {
  if (sites.length <= 1) return sites[0]
  const named = sites.filter(s => project in s.projects)
  if (named.length === 1) return named[0]
  throw usage(`${key} could come from two Jira sites: ${sites.map(s => s.site).join(', ')}`, `name the project in issue-tracker.sources[].projects of its site, such as ${project}: { fields: {} }`)
}

/** `GH-482` by the prefix of a GitHub source, `acme/shop#482` by its repo, or a Jira key such as `SHOP-12`. */
export function resolveRef(ref: string, config: IssuesConfig): Ref {
  const github = config.sources.filter((s): s is GitHubSource => s.type === 'github')
  const jira = config.sources.filter((s): s is JiraSource => s.type === 'jira')
  const byRepo = REPO_REF.exec(ref)
  if (byRepo) {
    const source = github.find(s => s.repo === byRepo[1])
    if (source) return { source, key: `${source.prefix}-${Number(byRepo[2])}`, number: Number(byRepo[2]) }
  }
  const byKey = KEY_REF.exec(ref)
  if (byKey) {
    const source = github.find(s => s.prefix === byKey[1])
    if (source) return { source, key: ref, number: Number(byKey[2]) }
    const site = jiraOf(ref, byKey[1]!, jira)
    if (site) return { source: site, key: ref }
  }
  const example = github[0] ?? { prefix: 'GH', repo: 'acme/shop' }
  throw usage(`${ref} names no source of this desk`, `use a Jira key such as SHOP-12, a prefix such as ${example.prefix}-482, or a repo of issue-tracker.sources, such as ${example.repo}#482`)
}
