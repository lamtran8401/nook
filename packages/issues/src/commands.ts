import type { Program } from '@nook/shared/cli.ts'
import { Exit } from '@nook/shared/errors.ts'

import { requireIssues } from './module.ts'
import { checkSource, type SourceCheck } from './sources.ts'

const line = (check: SourceCheck) => (check.ok ? `✓ ${check.label}: ${check.tool} has a login` : `✗ ${check.label}: ${check.problem}\n  fix: ${check.fix}`)

/** The commands of the pack issue-tracker. Each one only reads a tracker; the guard blocks the writes of `twg` and `gh`. */
export const issuesProgram: Program = {
  name: 'nook issues',
  summary: 'the issue-tracker pack of Nook: tickets of Jira and GitHub into the backlog, read only',
  commands: [
    {
      path: ['sources'],
      summary: 'the sources of this desk, and whether the CLI of each one is on the path and has a login',
      run(c) {
        const checks = requireIssues().config.sources.map(source => checkSource(source))
        c.out(checks, all => (all.length ? all.map(line).join('\n') : 'no source: add one to issue-tracker.sources with /setup'))
        return checks.every(check => check.ok) ? Exit.ok : Exit.refused
      },
    },
  ],
}
