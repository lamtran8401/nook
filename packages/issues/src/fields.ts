import { EvError, Exit } from '@nook/shared/errors.ts'

import type { IssuesConfig } from './config.ts'
import { getItem } from './jira.ts'
import { resolveRef } from './ref.ts'
import type { Runner } from './sources.ts'
import { twgJson } from './twg.ts'
import { valueText } from './values.ts'

/** One field or heading of a ticket, as `/setup` reads it to write the map: its id, its name and the start of its value. */
export type FieldRow = { id: string; name: string; start: string }

const START = 64
const startOf = (text: string) => {
  const line = text.replace(/\s+/g, ' ').trim()
  return line.length > START ? `${line.slice(0, START)}…` : line
}

function ghJson(runner: Runner, argv: string[], what: string): unknown {
  const run = runner(argv)
  if (run.code !== 0) throw new EvError(`${argv[0]} could not read ${what}: ${run.err.trim().split('\n')[0] ?? `exit ${run.code}`}`, Exit.error)
  return JSON.parse(run.out || '{}')
}

/** The name of each field id that the metadata of twg gives, wherever it sits in the answer. */
function namesIn(value: unknown, names = new Map<string, string>()): Map<string, string> {
  if (Array.isArray(value)) for (const entry of value) namesIn(entry, names)
  else if (value && typeof value === 'object') {
    const entry = value as Record<string, unknown>
    const id = [entry.id, entry.fieldId, entry.key].find(v => typeof v === 'string') as string | undefined
    if (id && typeof entry.name === 'string') names.set(id, entry.name)
    for (const child of Object.values(entry)) if (child && typeof child === 'object') namesIn(child, names)
  }
  return names
}

function jiraRows(site: string, key: string, runner: Runner): FieldRow[] {
  const item = getItem(site, key, [], runner)
  const names = namesIn(twgJson(runner, site, ['jira', 'workitem', 'field', 'update-metadata', '--id', key, '--include-system-fields'], `the fields of ${key}`))
  const all = { ...item, ...((item.fields as Record<string, unknown> | undefined) ?? {}) }
  return Object.entries(all).flatMap(([id, value]) => {
    if (id === 'fields' || id === 'comments' || id === 'attachments') return []
    const text = valueText(value)
    return text ? [{ id, name: names.get(id) ?? id, start: startOf(text) }] : []
  })
}

function githubRows(repo: string, number: number, runner: Runner): FieldRow[] {
  const issue = ghJson(runner, ['gh', 'issue', 'view', String(number), '--repo', repo, '--json', 'body,labels,milestone'], `${repo}#${number}`) as { body?: string; labels?: { name: string }[]; milestone?: { title: string } | null }
  const rows: FieldRow[] = []
  const lines = (issue.body ?? '').split('\n')
  lines.forEach((line, i) => {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (!heading) return
    const end = lines.findIndex((next, j) => j > i && /^#{1,6}\s/.test(next))
    rows.push({ id: `${heading[1]} ${heading[2]}`, name: heading[2]!, start: startOf(lines.slice(i + 1, end < 0 ? undefined : end).join(' ')) })
  })
  if (issue.labels?.length) rows.push({ id: 'labels', name: 'labels', start: issue.labels.map(l => l.name).join(', ') })
  if (issue.milestone) rows.push({ id: 'milestone', name: 'milestone', start: issue.milestone.title })
  return rows
}

/** Each field of a Jira item, or each heading of a GitHub issue, so that `/setup` can map them by their use. */
export function listFields(ref: string, config: IssuesConfig, runner: Runner): FieldRow[] {
  const found = resolveRef(ref, config)
  return found.source.type === 'jira' ? jiraRows(found.source.site, found.key, runner) : githubRows(found.source.repo, (found as { number: number }).number, runner)
}
