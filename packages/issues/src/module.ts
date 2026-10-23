import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { featureHome, type FeatureModule, type Finding } from '@nook/desk/desks.ts'
import { EvError, Exit } from '@nook/shared/errors.ts'

import { IssuesConfig } from './config.ts'
import { checkSource, type Runner } from './sources.ts'

/** The issue-tracker of a desk: the folder of the desk and its config. */
export type Issues = { home: string; config: IssuesConfig }

const FEATURE = 'issue-tracker'

/** The issue-tracker of the nearest desk above `cwd` whose nook.yml has its section. */
export function findIssues(cwd = process.cwd()): Issues | null {
  const home = featureHome(FEATURE, cwd)
  return home ? { home: home.dir, config: IssuesConfig.from(home.config.section(FEATURE)) } : null
}

export function requireIssues(cwd = process.cwd()): Issues {
  const issues = findIssues(cwd)
  if (issues) return issues
  throw new EvError('not inside a desk that turns the issue-tracker on', Exit.error, 'add an `issue-tracker:` section to nook.yml with /setup')
}

/** The issue-tracker of `dir` only when `dir` itself turns it on: a child does not check its parent. */
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
    if (error instanceof EvError) return [{ level: 'error', where: FEATURE, text: error.message, ...(error.fix ? { fix: error.fix } : {}) }]
    throw error
  }
  if (!issues) return []
  if (issues.config.missing) return [{ level: 'warn', where: FEATURE, text: 'nook.yml has no issue-tracker section with the sources', fix: 'write it with /setup' }]
  if (!issues.config.sources.length) return [{ level: 'warn', where: FEATURE, text: 'issue-tracker has no source', fix: 'add a jira or github source to issue-tracker.sources with /setup' }]
  return issues.config.sources.map(source => {
    const check = checkSource(source, runner)
    if (check.ok) return { level: 'ok' as const, where: FEATURE, text: `${check.label}: ${check.tool} has a login` }
    return { level: 'error' as const, where: FEATURE, text: `${check.label}: ${check.problem}`, ...(check.fix ? { fix: check.fix } : {}) }
  })
}

export const issuesModule: FeatureModule = {
  name: FEATURE,

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
