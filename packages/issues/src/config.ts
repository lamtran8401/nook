import { usage } from '@nook/shared/errors.ts'

/** The `issue-tracker` section of nook.yml: the folder of the tickets, and each source with the map of its fields by use. */

/** A Jira site: each use, such as acceptanceCriteria, names a field id; a project can override the map; `skip` lists the types with no local work. */
export type JiraSource = {
  type: 'jira'
  site: string
  fields: Record<string, string>
  projects: Record<string, { fields: Record<string, string> }>
  skip: string[]
}
/** A GitHub repo: each use names a heading of the issue body; the prefix makes the id of an item, such as GH-482. */
export type GitHubSource = { type: 'github'; repo: string; prefix: string; sections: Record<string, string> }
export type Source = JiraSource | GitHubSource

type Raw = Record<string, unknown>

const FIELD_ID = /^customfield_\d+$/
const REPO = /^[\w.-]+\/[\w.-]+$/
const PREFIX = /^[A-Z][A-Z0-9]*$/

const isMap = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** A map of uses to words, such as the headings of a GitHub body. */
function words(value: unknown, where: string): Record<string, string> {
  if (value === undefined) return {}
  if (!isMap(value)) throw usage(`nook.yml: ${where} must be a map of uses`)
  return Object.fromEntries(Object.entries(value).map(([use, word]) => [use, text(word)]))
}

/** A map of uses to Jira field ids; a value that is no id stops with its key. */
function fieldIds(value: unknown, where: string): Record<string, string> {
  const map = words(value, where)
  for (const [use, id] of Object.entries(map))
    if (!FIELD_ID.test(id)) throw usage(`nook.yml: ${where}.${use} is "${id}", not a Jira field id`, 'write the id as customfield_<number>; nook issues fields <ref> lists the ids of a ticket')
  return map
}

function skipped(value: unknown, where: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw usage(`nook.yml: ${where}.skip must be a list of tracker types, such as [Epic, Release]`)
  return value.map(text).filter(Boolean)
}

function jira(raw: Raw, where: string): JiraSource {
  const site = text(raw.site)
  if (!site) throw usage(`nook.yml: ${where}.site must name the Jira site, such as company.atlassian.net`)
  if (raw.projects !== undefined && !isMap(raw.projects)) throw usage(`nook.yml: ${where}.projects must be a map of project keys`)
  const projects = Object.fromEntries(Object.entries((raw.projects as Raw | undefined) ?? {}).map(([key, value]) => [key, { fields: fieldIds(isMap(value) ? value.fields : undefined, `${where}.projects.${key}.fields`) }]))
  return { type: 'jira', site, fields: fieldIds(raw.fields, `${where}.fields`), projects, skip: skipped(raw.skip, where) }
}

function github(raw: Raw, where: string): GitHubSource {
  const repo = text(raw.repo)
  if (!REPO.test(repo)) throw usage(`nook.yml: ${where}.repo must be owner/name, such as acme/shop`)
  const prefix = raw.prefix === undefined ? 'GH' : text(raw.prefix)
  if (!PREFIX.test(prefix)) throw usage(`nook.yml: ${where}.prefix must be capital letters and digits, such as GH`)
  return { type: 'github', repo, prefix, sections: words(raw.sections, `${where}.sections`) }
}

function source(value: unknown, i: number): Source {
  const where = `issue-tracker.sources[${i}]`
  const raw = isMap(value) ? value : {}
  if (raw.type === 'jira') return jira(raw, where)
  if (raw.type === 'github') return github(raw, where)
  throw usage(`nook.yml: ${where}.type must be jira or github`)
}

export class IssuesConfig {
  private constructor(
    /** The folder of the tickets, relative to the desk. */
    readonly backlog: string,
    readonly sources: Source[],
    readonly missing: boolean,
  ) {}

  static from(section: unknown): IssuesConfig {
    // `issue-tracker:` alone or `issue-tracker: {}` turns it on, with a section that /setup has not filled in
    if (section === undefined || section === null || (isMap(section) && !Object.keys(section).length)) return new IssuesConfig('backlog', [], true)
    if (!isMap(section)) throw usage('nook.yml: issue-tracker must be a map of keys')
    if (section.sources !== undefined && !Array.isArray(section.sources)) throw usage('nook.yml: issue-tracker.sources must be a list')
    return new IssuesConfig(text(section.backlog) || 'backlog', ((section.sources as unknown[] | undefined) ?? []).map(source), false)
  }
}
