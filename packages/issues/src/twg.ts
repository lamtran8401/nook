import { EvError, Exit } from '@nook/shared/errors.ts'

import type { Runner } from './sources.ts'

/** The argv of a twg command on a Jira site. */
export const twgArgs = (site: string, ...command: string[]) => ['twg', '--site', site, ...command]

const firstLine = (text: string) => text.trim().split('\n')[0] ?? ''

/**
 * Runs a read of twg and gives its JSON. `--output-summary none` keeps the payload on stdout: without it, twg in an
 * agent session can write a large payload to a file and print only its path.
 */
export function twgJson(runner: Runner, site: string, command: string[], what: string): unknown {
  const run = runner([...twgArgs(site, ...command), '-o', 'json', '--output-summary', 'none'])
  if (run.code !== 0) throw new EvError(`twg could not read ${what}: ${firstLine(run.err) || `exit ${run.code}`}`, Exit.error)
  try {
    return JSON.parse(run.out)
  } catch {
    throw new EvError(`twg gave no JSON for ${what}: ${firstLine(run.out)}`, Exit.error)
  }
}
