import { join } from 'node:path'

import { runCommand } from '@nook/shared/run.ts'

const web = join(import.meta.dirname, '..')
let made: ReturnType<typeof runCommand> | null = null

/**
 * The build of the web app under Node with no desk, made once for the whole run: the test files of e2e share one
 * process, so each one that needs the app waits for this build and never runs an older one.
 */
export function buildOnce(): ReturnType<typeof runCommand> {
  if (made) return made
  const env: NodeJS.ProcessEnv = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
  delete env.NOOK_DESK
  made = runCommand(['node', join(web, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], { cwd: web, env, timeoutMs: 300_000 })
  return made
}
