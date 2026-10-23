import { EvError, Exit, refused } from '@nook/shared/errors.ts'

import type { JiraSource } from './config.ts'
import type { Read } from './github.ts'
import type { Runner } from './sources.ts'
import { headingOf, type Section } from './ticket.ts'
import { twgJson } from './twg.ts'
import { isLong, valueText } from './values.ts'

/** A file of a work item: its name, its size and its address. */
export type Attachment = { id: string; name: string; size: number; link: string }
export type JiraRead = Read & { attachments: Attachment[] }

export type Item = Record<string, unknown> & { fields?: Record<string, unknown> }

const CRITERIA = 'acceptanceCriteria'

/** A field of the item, on the item or under its fields, as twg can give either. */
const fieldOf = (item: Item, id: string): unknown => item[id] ?? item.fields?.[id]

/** The shape of an answer by its keys only, so an error names it without the text of a ticket. */
function shapeOf(answer: unknown): string {
  const data = (answer as { data?: unknown } | null)?.data
  if (Array.isArray(data)) return `data is a list of ${data.length}`
  if (data && typeof data === 'object') return `data has ${Object.keys(data).join(', ') || 'no key'}`
  return `the answer has ${(answer && typeof answer === 'object' ? Object.keys(answer).join(', ') : '') || 'nothing'}`
}

/** The item of a twg answer, by the rule that twg gives: `data.items[0].data`, the first of `data` as a list, or `data`. */
function itemOf(answer: unknown, key: string): Item {
  const data = (answer as { data?: unknown } | null)?.data
  const items = (data as { items?: { data?: unknown }[] } | undefined)?.items
  const item = (Array.isArray(items) ? items[0]?.data : Array.isArray(data) ? data[0] : data) as Item | undefined
  if (!item || typeof item !== 'object' || (!item.key && !fieldOf(item, 'summary'))) throw new EvError(`twg gave no work item for ${key}: ${shapeOf(answer)}`, Exit.error)
  if (typeof item.key === 'string' && item.key.toUpperCase() !== key.toUpperCase()) throw new EvError(`twg gave ${item.key} when asked for ${key}`, Exit.error)
  return item
}

/** The map of a key: the map of the source, with the override of its project for each use it names. */
const mapOf = (source: JiraSource, key: string) => ({ ...source.fields, ...source.projects[key.split('-')[0]!]?.fields })

/** Reads one work item with `twg jira workitem get --full`, and each field id of the map by name. */
export function getItem(site: string, key: string, fieldIds: string[], runner: Runner): Item {
  return itemOf(twgJson(runner, site, ['jira', 'workitem', 'get', key, '--full', ...fieldIds.flatMap(id => ['--field', id])], key), key)
}

/** The files of a work item, from the attachment query of twg: its `data` is the list. */
function filesOf(site: string, key: string, runner: Runner): Attachment[] {
  const list = (twgJson(runner, site, ['jira', 'workitem', 'attachment', 'query', '--issue-id', key], `the files of ${key}`) as { data?: unknown })?.data
  if (!Array.isArray(list)) throw new EvError(`twg gave no list of the files of ${key}`, Exit.error)
  return (list as Record<string, unknown>[]).map(file => ({
    id: String(file.id),
    name: String(file.filename ?? file.name ?? file.id),
    size: Number(file.size) || 0,
    link: String(file.content ?? file.url ?? `https://${site}/browse/${key}`),
  }))
}

/** An Epic holds work items and is none itself, so the pull stops and names its stories. */
function refuseEpic(site: string, key: string, runner: Runner): never {
  const answer = twgJson(runner, site, ['jira', 'workitem', 'query', '--jql', `parent = ${key}`], `the stories of ${key}`) as { data?: { issues?: Record<string, unknown>[] } }
  const stories = (answer?.data?.issues ?? []).map(story => `${String(story.key)} ${valueText(story.summary) ?? ''}`.trim())
  if (!stories.length) throw refused(`${key} is an Epic, not a work item, and it has no story`, 'pull a story or a task of the Epic')
  throw refused(`${key} is an Epic, not a work item. Its stories: ${stories.join(', ')}`, `pull one story, such as nook issues pull ${stories[0]!.split(' ')[0]}`)
}

function commentsOf(item: Item) {
  const raw = fieldOf(item, 'comments') ?? (fieldOf(item, 'comment') as { comments?: unknown } | undefined)?.comments ?? []
  return (raw as Record<string, unknown>[]).map(c => ({ author: valueText(c.author) ?? 'someone', at: String(c.created ?? '').slice(0, 10), body: valueText(c.body) ?? '' }))
}

/** A type in `skip` of the source stops the pull: it has no local work in this workspace. */
function refuseSkipped(source: JiraSource, key: string, type: string): void {
  if (source.skip.includes(type)) throw refused(`${key} is a ${type}: that type has no local work in this workspace`, `pull a ticket of another type, or take ${type} out of skip of the source in nook.yml`)
}

/** Reads one work item and its files through twg, which holds the login. An Epic stops the read. */
export function readJira(source: JiraSource, key: string, runner: Runner): JiraRead {
  const map = mapOf(source, key)
  const item = getItem(source.site, key, [...new Set(Object.values(map))], runner)
  const type = valueText(fieldOf(item, 'issuetype') ?? fieldOf(item, 'issueType')) ?? ''
  if (type.toLowerCase() === 'epic') refuseEpic(source.site, key, runner)
  refuseSkipped(source, key, type)
  const link = valueText(item.url) ?? `https://${source.site}/browse/${key}`
  const fields: [string, string][] = [['Source', link]]
  for (const [name, id] of [['Type', 'issuetype'], ['Status', 'status'], ['Priority', 'priority'], ['Assignee', 'assignee'], ['Reporter', 'reporter'], ['Labels', 'labels']] as const) {
    const text = valueText(fieldOf(item, id) ?? fieldOf(item, id === 'issuetype' ? 'issueType' : id))
    if (text) fields.push([name, text])
  }
  const parent = (fieldOf(item, 'parent') as { key?: unknown } | undefined)?.key
  if (typeof parent === 'string') fields.push(['Parent', parent])
  const sections: Section[] = []
  const missing: string[] = []
  for (const [use, id] of Object.entries(map)) {
    const value = fieldOf(item, id)
    const text = valueText(value)
    if (text === null) missing.push(use)
    // the criteria and long text get a part of their own; a short value, such as a sprint, is a row of Fields
    if (use === CRITERIA || isLong(value) || text === null) sections.push({ use, text })
    else fields.push([headingOf(use), text])
  }
  return {
    ticket: { key, title: valueText(fieldOf(item, 'summary')) ?? key, link, fields, description: valueText(fieldOf(item, 'description')) ?? '', sections, comments: commentsOf(item) },
    missing,
    attachments: filesOf(source.site, key, runner),
  }
}
