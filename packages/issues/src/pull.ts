import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { EvError, refused } from '@nook/shared/errors.ts'

import { readGitHub } from './github.ts'
import type { Issues } from './module.ts'
import { resolveRef } from './ref.ts'
import { checkSource, run, type Runner } from './sources.ts'
import { renderTicket, sectionsOf } from './ticket.ts'

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
}

/** The headings whose text differs between two ticket files; a new or a gone heading counts. */
function changedParts(before: string, after: string): string[] {
  const old = sectionsOf(before)
  const now = sectionsOf(after)
  const titleChanged = before.split('\n')[0] !== after.split('\n')[0]
  return [...(titleChanged ? ['Title'] : []), ...[...new Set([...Object.keys(old), ...Object.keys(now)])].filter(h => old[h] !== now[h])]
}

/**
 * Reads each ticket and writes `<backlog>/<KEY>/ticket.md`. Every ref is checked before any file is written. A read
 * that fails because the CLI or its login is missing stops with exit 3 and the fix. The ledger is not touched: the
 * item keeps its state.
 */
export function pull(issues: Issues, refs: string[], runner: Runner = run): PullReport[] {
  const resolved = refs.map(ref => resolveRef(ref, issues.config))
  return resolved.map(({ source, key, number }) => {
    let read
    try {
      read = readGitHub(source, number, runner)
    } catch (error) {
      const check = checkSource(source, runner)
      if (!check.ok) throw refused(`${check.label}: ${check.problem}`, check.fix)
      throw error instanceof EvError ? error : new EvError(String(error))
    }
    const file = join(issues.config.backlog, key, 'ticket.md')
    const path = join(issues.home, file)
    const text = renderTicket(read.ticket)
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
    const changed = before === null ? [] : changedParts(before, text)
    return {
      key,
      title: read.ticket.title,
      link: read.ticket.link,
      file,
      status: before === null ? 'new' : changed.length ? 'updated' : 'same',
      changed,
      missing: read.missing,
      criteria: read.ticket.sections.some(s => s.use === 'acceptanceCriteria' && s.text !== null),
    }
  })
}
