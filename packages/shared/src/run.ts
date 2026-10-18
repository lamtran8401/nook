import { spawnSync } from 'node:child_process'

export type CommandRun = { code: number; out: string; err: string }
export type RunOptions = { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }

// git can print a large diff; the Node default of 1 MB would cut it
const MAX_OUTPUT = 256 * 1024 * 1024

/** Runs a program with no shell, under Bun or Node. A time limit, a signal or a missing program counts as a failure. */
export function runCommand(argv: string[], options: RunOptions = {}): CommandRun {
  const [program = '', ...args] = argv
  const run = spawnSync(program, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    timeout: options.timeoutMs,
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const err = run.error ? `${run.stderr ?? ''}${run.error.message}` : (run.stderr ?? '')
  return { code: run.status ?? 1, out: run.stdout ?? '', err }
}

/** The lines of a failed command that name an error, else its last lines: what a person needs to fix it. */
export function errorLines(output: string): string {
  const lines = output.split('\n').map(line => line.trim()).filter(Boolean)
  const errors = lines.filter(line => /error|ERR!|failed/i.test(line))
  return (errors.length ? errors.slice(0, 5) : lines.slice(-5)).join('\n')
}
