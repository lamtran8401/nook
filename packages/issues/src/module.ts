import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { activePacks, type Finding, type PackModule } from '@nook/desk/desks.ts'
import { EvError, Exit } from '@nook/shared/errors.ts'

import { IssuesConfig } from './config.ts'
import { checkSource, type Runner } from './sources.ts'

/** The pack issue-tracker of a desk: the folder of the desk and its config. */
export type Issues = { home: string; config: IssuesConfig }

const PACK = 'issue-tracker'

/** The pack of the nearest desk above `cwd` that turns it on. */
export function findIssues(cwd = process.cwd()): Issues | null {
  const pack = activePacks(cwd).find(p => p.name === PACK)
  return pack ? { home: pack.home.dir, config: IssuesConfig.from(pack.home.config.section(PACK)) } : null
}

export function requireIssues(cwd = process.cwd()): Issues {
  const issues = findIssues(cwd)
  if (issues) return issues
  throw new EvError('not inside a desk that turns the issue-tracker pack on', Exit.error, 'run nook init --pack issue-tracker, then /setup')
}

/** The pack of `dir` only when `dir` itself turns it on: a child does not check its parent. */
function issuesAt(dir: string): Issues | null {
  const issues = findIssues(dir)
  return issues && issues.home === dir ? issues : null
}

/** The gaps of the pack in `dir`: the section, then each source with its CLI and its login. */
export function issuesDoctor(dir: string, runner?: Runner): Finding[] {
  let issues: Issues | null
  try {
    issues = issuesAt(dir)
  } catch (error) {
    if (error instanceof EvError) return [{ level: 'error', where: PACK, text: error.message, ...(error.fix ? { fix: error.fix } : {}) }]
    throw error
  }
  if (!issues) return []
  if (issues.config.missing) return [{ level: 'warn', where: PACK, text: 'nook.yml has no issue-tracker section with the sources', fix: 'write it with /setup' }]
  if (!issues.config.sources.length) return [{ level: 'warn', where: PACK, text: 'issue-tracker has no source', fix: 'add a jira or github source to issue-tracker.sources with /setup' }]
  return issues.config.sources.map(source => {
    const check = checkSource(source, runner)
    if (check.ok) return { level: 'ok' as const, where: PACK, text: `${check.label}: ${check.tool} has a login` }
    return { level: 'error' as const, where: PACK, text: `${check.label}: ${check.problem}`, ...(check.fix ? { fix: check.fix } : {}) }
  })
}

export const issuesModule: PackModule = {
  name: PACK,

  setup(dir) {
    const issues = issuesAt(dir)
    if (!issues) return []
    const backlog = join(dir, issues.config.backlog)
    if (existsSync(backlog)) return []
    mkdirSync(backlog, { recursive: true })
    return [`${issues.config.backlog}/`]
  },

  configured(dir) {
    return !issuesAt(dir)?.config.missing
  },

  doctor(dir) {
    return issuesDoctor(dir)
  },
}
