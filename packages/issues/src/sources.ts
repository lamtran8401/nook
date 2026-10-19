import { type CommandRun, runCommand } from '@nook/shared/run.ts'

import type { Source } from './config.ts'

/** Whether the CLI of a source is on the path and has a login. Nook keeps no token: `twg` and `gh` hold the logins. */
export type SourceCheck = { label: string; tool: 'twg' | 'gh'; ok: boolean; problem?: string; fix?: string }
export type Runner = (argv: string[]) => CommandRun

// a login check or a read asks the server, so it gets a time limit
const CHECK_MS = 15_000
export const run: Runner = argv => runCommand(argv, { timeoutMs: CHECK_MS })

const TOOL = {
  jira: { tool: 'twg', install: 'install the twg CLI of Atlassian Teamwork Graph, then twg login' },
  github: { tool: 'gh', install: 'install the GitHub CLI: brew install gh' },
} as const

const labelOf = (source: Source) => (source.type === 'jira' ? `jira ${source.site}` : `github ${source.repo}`)
const hostOf = (source: Source) => (source.type === 'jira' ? source.site : 'github.com')
const loginCheck = (source: Source) => (source.type === 'jira' ? ['twg', '--site', source.site, 'whoami'] : ['gh', 'auth', 'status', '--hostname', 'github.com'])
const loginFix = (source: Source) => (source.type === 'jira' ? `twg login --site ${source.site}` : 'gh auth login')

/** Checks one source; only the exit codes count, so no line of the tool, and no token, ever shows. */
export function checkSource(source: Source, runner: Runner = run): SourceCheck {
  const { tool, install } = TOOL[source.type]
  const label = labelOf(source)
  const version = runner([tool, '--version'])
  if (version.code !== 0 && version.err.includes('ENOENT')) return { label, tool, ok: false, problem: `${tool} is not on the path`, fix: install }
  if (runner(loginCheck(source)).code !== 0) return { label, tool, ok: false, problem: `${tool} has no login for ${hostOf(source)}`, fix: loginFix(source) }
  return { label, tool, ok: true }
}
