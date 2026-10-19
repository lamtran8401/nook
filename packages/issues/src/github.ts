import { EvError, Exit } from '@nook/shared/errors.ts'

import type { GitHubSource } from './config.ts'
import type { Runner } from './sources.ts'
import type { Section, Ticket } from './ticket.ts'

/** What a pull reads: the ticket, and each use of the map that the ticket does not have. */
export type Read = { ticket: Ticket; missing: string[] }

type GhIssue = {
  title: string
  url: string
  state: string
  author?: { login: string } | null
  labels?: { name: string }[]
  milestone?: { title: string } | null
  assignees?: { login: string }[]
  body?: string | null
  comments?: { author?: { login: string } | null; body: string; createdAt: string }[]
}

const FIELDS = 'number,title,url,state,author,createdAt,labels,milestone,assignees,body,comments'

type Heading = { line: number; level: number; text: string }

/** The headings of a Markdown text, outside its code fences. */
function headings(lines: string[]): Heading[] {
  let fence = false
  return lines.flatMap((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const found = fence ? null : /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    return found ? [{ line: i, level: found[1]!.length, text: found[2]! }] : []
  })
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** The body split by the heading of each use: the text of each use, and the description with those parts taken out. */
function splitBody(body: string, map: Record<string, string>): { description: string; sections: Section[] } {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const all = headings(lines)
  const taken = new Set<number>()
  const sections = Object.entries(map).map(([use, heading]) => {
    const at = all.findIndex(h => same(h.text, heading))
    if (at < 0) return { use, text: null }
    const start = all[at]!
    const end = all.slice(at + 1).find(h => h.level <= start.level)?.line ?? lines.length
    for (let i = start.line; i < end; i++) taken.add(i)
    return { use, text: lines.slice(start.line + 1, end).join('\n').trim() || null }
  })
  const description = lines.filter((_, i) => !taken.has(i)).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return { description, sections }
}

/** Reads one issue with `gh issue view --json`; `gh` holds the login. */
export function readGitHub(source: GitHubSource, number: number, runner: Runner): Read {
  const key = `${source.prefix}-${number}`
  const run = runner(['gh', 'issue', 'view', String(number), '--repo', source.repo, '--json', FIELDS])
  if (run.code !== 0) throw new EvError(`gh could not read ${key}: ${run.err.trim().split('\n')[0] ?? `exit ${run.code}`}`, Exit.error)
  const issue = JSON.parse(run.out) as GhIssue
  const { description, sections } = splitBody(issue.body ?? '', source.sections)
  const fields: [string, string][] = [['Source', issue.url], ['State', issue.state.toLowerCase()]]
  if (issue.author) fields.push(['Author', issue.author.login])
  if (issue.labels?.length) fields.push(['Labels', issue.labels.map(l => l.name).join(', ')])
  if (issue.milestone) fields.push(['Milestone', issue.milestone.title])
  if (issue.assignees?.length) fields.push(['Assignees', issue.assignees.map(a => a.login).join(', ')])
  return {
    ticket: {
      key,
      title: issue.title,
      link: issue.url,
      fields,
      description,
      sections,
      comments: (issue.comments ?? []).map(c => ({ author: c.author?.login ?? 'someone', at: c.createdAt.slice(0, 10), body: c.body.trim() })),
    },
    missing: sections.filter(s => s.text === null).map(s => s.use),
  }
}
