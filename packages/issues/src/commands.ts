import type { Program } from '@nook/shared/cli.ts'
import { Exit, usage } from '@nook/shared/errors.ts'
import { readInput, runHook } from '@nook/shared/hook.ts'

import { listFields } from './fields.ts'
import { trackerHook } from './guard.ts'
import { requireIssues } from './module.ts'
import { pull, type PullReport } from './pull.ts'
import { checkSource, run, type SourceCheck } from './sources.ts'
import { headingOf } from './ticket.ts'

const line = (check: SourceCheck) => (check.ok ? `✓ ${check.label}: ${check.tool} has a login` : `✗ ${check.label}: ${check.problem}\n  fix: ${check.fix}`)

/** One pull in a few lines: the file, the title and the link, then what the next stage must know. */
function pulled(report: PullReport): string {
  const lines = [`✓ ${report.key} ${report.status}: ${report.file}`, `  ${report.title} · ${report.link}`]
  if (report.changed.length) lines.push(`  changed: ${report.changed.join(', ')}`)
  if (!report.criteria) lines.push('  no acceptance criteria in the ticket: /spec asks for them')
  const missing = report.missing.filter(use => use !== 'acceptanceCriteria')
  if (missing.length) lines.push(`  not in the ticket: ${missing.map(headingOf).join(', ')}`)
  return lines.join('\n')
}

/** The commands of the pack issue-tracker. Each one only reads a tracker; the guard blocks the writes of `twg` and `gh`. */
export const issuesProgram: Program = {
  name: 'nook issues',
  summary: 'the issue-tracker pack of Nook: tickets of Jira and GitHub into the backlog, read only',
  commands: [
    {
      path: ['pull'],
      summary: 'reads each ticket and writes backlog/<KEY>/ticket.md; a second pull names each part that changed',
      usage: '<ref...>',
      run(c) {
        if (!c.args.length) throw usage('name a ticket, such as GH-482 or acme/shop#482')
        c.out(pull(requireIssues(), c.args), reports => reports.map(pulled).join('\n'))
        return Exit.ok
      },
    },
    {
      path: ['fields'],
      summary: 'each field of a Jira ticket, or each heading of a GitHub issue, with its id, its name and the start of its value',
      usage: '<ref>',
      run(c) {
        const ref = c.args[0]
        if (!ref) throw usage('name one ticket, such as SHOP-12 or GH-482')
        const rows = listFields(ref, requireIssues().config, run)
        c.out(rows, all => all.map(r => `${r.id.padEnd(22)} ${r.name.padEnd(24)} ${r.start}`).join('\n'))
        return Exit.ok
      },
    },
    {
      path: ['sources'],
      summary: 'the sources of this desk, and whether the CLI of each one is on the path and has a login',
      run(c) {
        const checks = requireIssues().config.sources.map(source => checkSource(source))
        c.out(checks, all => (all.length ? all.map(line).join('\n') : 'no source: add one to issue-tracker.sources with /setup'))
        return checks.every(check => check.ok) ? Exit.ok : Exit.refused
      },
    },
    {
      path: ['hook'],
      summary: 'run one hook with the Claude Code event on stdin (bash: the guard that blocks a write of twg or gh)',
      usage: '<name>',
      async run(c) {
        if (c.args[0] !== 'bash') {
          c.say(`no hook is named ${c.args[0] ?? '(none)'}`)
          return Exit.usage
        }
        const input = await readInput()
        return runHook(() => trackerHook(input), true)
      },
    },
  ],
}
