/** Runs one shell command in a folder, with `CI=true` and a time limit; null exit codes count as failures. */

export type ShellRun = { code: number; output: string }

export function runShell(command: string, cwd: string, limitMs: number): ShellRun {
  const run = Bun.spawnSync(['sh', '-c', command], {
    cwd,
    env: { ...process.env, CI: 'true' },
    timeout: limitMs,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return { code: run.exitCode ?? 1, output: `${run.stdout.toString()}${run.stderr.toString()}` }
}
