import { runCommand } from '@nook/shared/run.ts'

/** Runs one shell command in a folder, with `CI=true` and a time limit; null exit codes count as failures. */

export type ShellRun = { code: number; output: string }

export function runShell(command: string, cwd: string, limitMs: number): ShellRun {
  const run = runCommand(['sh', '-c', command], { cwd, env: { ...process.env, CI: 'true' }, timeoutMs: limitMs })
  return { code: run.code, output: `${run.out}${run.err}` }
}
