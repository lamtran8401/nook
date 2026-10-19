import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import { EvError, refused } from '@nook/shared/errors.ts'

import { readGitHub, type Read } from './github.ts'
import { type Attachment, readJira } from './jira.ts'
import type { Issues } from './module.ts'
import { type Ref, resolveRef } from './ref.ts'
import { checkSource, run, type Runner } from './sources.ts'
import { renderTicket, sectionsOf, type TicketFile } from './ticket.ts'

/** What one pull did: the item it is for, whether the ticket is new, changed or the same, and the gaps of its map. */
export type PullReport = {
  key: string
  title: string
  link: string
  file: string
  status: 'new' | 'updated' | 'same'
  /** The headings of the parts that changed since the last pull. */
  changed: string[]
  /** The uses of the map that the ticket does not have. */
  missing: string[]
  criteria: boolean
  /** The files kept in `attachments/`, and the files too large to keep, which stay links. */
  attachments: number
  links: number
}

// a file larger than this stays a link: the backlog holds tickets, not videos
const KEEP_BYTES = 10 * 1024 * 1024

const megabytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`

/** The headings whose text differs between two ticket files; a new or a gone heading counts. */
function changedParts(before: string, after: string): string[] {
  const old = sectionsOf(before)
  const now = sectionsOf(after)
  const titleChanged = before.split('\n')[0] !== after.split('\n')[0]
  return [...(titleChanged ? ['Title'] : []), ...[...new Set([...Object.keys(old), ...Object.keys(now)])].filter(h => old[h] !== now[h])]
}

/** Each file of 10 MB or less into `attachments/`, through twg; a larger one stays a link. The name keeps only its last part. */
function keepFiles(ref: Ref, attachments: Attachment[], folder: string, runner: Runner): TicketFile[] {
  return attachments.map(file => {
    if (file.size > KEEP_BYTES) return { name: file.name, link: file.link, size: megabytes(file.size) }
    const name = basename(file.name)
    mkdirSync(join(folder, 'attachments'), { recursive: true })
    const site = ref.source.type === 'jira' ? ref.source.site : ''
    const saved = runner(['twg', '--site', site, 'jira', 'workitem', 'attachment', 'download', '--attachment-id', file.id, '--output-path', join(folder, 'attachments', name)])
    if (saved.code !== 0) throw new EvError(`twg could not download ${file.name} of ${ref.key}: ${saved.err.trim().split('\n')[0] ?? `exit ${saved.code}`}`)
    return { name, kept: `attachments/${name}` }
  })
}

/** Reads one ticket from its source; a read that fails because the CLI or its login is missing stops with exit 3 and the fix. */
function read(ref: Ref, runner: Runner): Read & { attachments: Attachment[] } {
  try {
    return ref.source.type === 'jira' ? readJira(ref.source, ref.key, runner) : { ...readGitHub(ref.source, (ref as { number: number }).number, runner), attachments: [] }
  } catch (error) {
    const check = checkSource(ref.source, runner)
    if (!check.ok) throw refused(`${check.label}: ${check.problem}`, check.fix)
    throw error instanceof EvError ? error : new EvError(String(error))
  }
}

/**
 * Reads each ticket and writes `<backlog>/<KEY>/ticket.md` with its files. Every ref is checked before any file is
 * written. The ledger is not touched: the item keeps its state.
 */
export function pull(issues: Issues, refs: string[], runner: Runner = run): PullReport[] {
  const resolved = refs.map(ref => resolveRef(ref, issues.config))
  return resolved.map(ref => {
    const got = read(ref, runner)
    const file = join(issues.config.backlog, ref.key, 'ticket.md')
    const path = join(issues.home, file)
    mkdirSync(dirname(path), { recursive: true })
    const files = keepFiles(ref, got.attachments, dirname(path), runner)
    const text = renderTicket({ ...got.ticket, files })
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null
    writeFileSync(path, text)
    const changed = before === null ? [] : changedParts(before, text)
    return {
      key: ref.key,
      title: got.ticket.title,
      link: got.ticket.link,
      file,
      status: before === null ? 'new' : changed.length ? 'updated' : 'same',
      changed,
      missing: got.missing,
      criteria: got.ticket.sections.some(s => s.use === 'acceptanceCriteria' && s.text !== null),
      attachments: files.filter(f => f.kept).length,
      links: files.filter(f => !f.kept).length,
    }
  })
}
