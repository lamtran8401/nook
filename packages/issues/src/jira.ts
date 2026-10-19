import { EvError, Exit } from '@nook/shared/errors.ts'

import type { JiraSource } from './config.ts'
import type { Read } from './github.ts'
import type { Runner } from './sources.ts'
import { headingOf, type Section } from './ticket.ts'
import { isLong, valueText } from './values.ts'

/** A file of a work item: its name, its size and its address. */
export type Attachment = { id: string; name: string; size: number; link: string }
export type JiraRead = Read & { attachments: Attachment[] }

type Item = Record<string, unknown> & { fields?: Record<string, unknown> }

const CRITERIA = 'acceptanceCriteria'

/** The item of a twg answer: `data` for one key, `data.items[0].data` for a batch. */
function itemOf(answer: unknown): Item {
  const data = (answer as { data?: unknown })?.data as Record<string, unknown> | undefined
  const items = data?.items as { data?: Item }[] | undefined
  const item = items?.[0]?.data ?? data
  if (!item || typeof item !== 'object') throw new EvError('twg gave no work item', Exit.error)
  return item as Item
}

/** A field of the item, on the item or under its fields, as twg can give either. */
const fieldOf = (item: Item, id: string): unknown => item[id] ?? item.fields?.[id]

/** The map of a key: the map of the source, with the override of its project for each use it names. */
const mapOf = (source: JiraSource, key: string) => ({ ...source.fields, ...source.projects[key.split('-')[0]!]?.fields })

function attachmentsOf(item: Item): Attachment[] {
  const list = (fieldOf(item, 'attachments') ?? fieldOf(item, 'attachment') ?? []) as Record<string, unknown>[]
  return list.map(file => ({ id: String(file.id), name: String(file.filename ?? file.name ?? file.id), size: Number(file.size) || 0, link: String(file.content ?? file.url ?? '') }))
}

function commentsOf(item: Item) {
  const raw = fieldOf(item, 'comments') ?? (fieldOf(item, 'comment') as { comments?: unknown } | undefined)?.comments ?? []
  return (raw as Record<string, unknown>[]).map(c => ({ author: valueText(c.author) ?? 'someone', at: String(c.created ?? '').slice(0, 10), body: valueText(c.body) ?? '' }))
}

/** Reads one work item with `twg jira workitem get --full`; `twg` holds the login. */
export function readJira(source: JiraSource, key: string, runner: Runner): JiraRead {
  const run = runner(['twg', '--site', source.site, 'jira', 'workitem', 'get', key, '--full', '-o', 'json'])
  if (run.code !== 0) throw new EvError(`twg could not read ${key}: ${run.err.trim().split('\n')[0] ?? `exit ${run.code}`}`, Exit.error)
  const item = itemOf(JSON.parse(run.out))
  const link = valueText(item.url) ?? `https://${source.site}/browse/${key}`
  const fields: [string, string][] = [['Source', link]]
  for (const [name, id] of [['Type', 'issuetype'], ['Status', 'status'], ['Priority', 'priority'], ['Assignee', 'assignee'], ['Reporter', 'reporter'], ['Labels', 'labels']] as const) {
    const text = valueText(fieldOf(item, id) ?? fieldOf(item, id === 'issuetype' ? 'issueType' : id))
    if (text) fields.push([name, text])
  }
  const sections: Section[] = []
  const missing: string[] = []
  for (const [use, id] of Object.entries(mapOf(source, key))) {
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
    attachments: attachmentsOf(item),
  }
}
