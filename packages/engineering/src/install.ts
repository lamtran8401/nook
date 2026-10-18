import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The install of an area runs only when its dependencies are missing or older than its lockfile. */

export const LOCKFILES = ['bun.lock', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'uv.lock', 'poetry.lock', 'Gemfile.lock', 'go.sum', 'Cargo.lock']

// the folder that a lockfile fills inside the area; the others fill a cache outside it
const DEPENDENCY_DIR: Record<string, string> = {
  'bun.lock': 'node_modules',
  'package-lock.json': 'node_modules',
  'pnpm-lock.yaml': 'node_modules',
  'yarn.lock': 'node_modules',
  'uv.lock': '.venv',
  'poetry.lock': '.venv',
}

export const INSTALL_PREFIX = 'install: '

/** The hash of the first lockfile of the folder, or '' when it has none. */
export function lockHash(dir: string): string {
  const lockfile = LOCKFILES.find(name => existsSync(join(dir, name)))
  return lockfile ? createHash('sha256').update(readFileSync(join(dir, lockfile))).digest('hex') : ''
}

/** True when the area never installed, its lockfile changed since `lastLock`, or the folder that its lockfile fills is gone. */
export function needsInstall(dir: string, lastLock: string | null): boolean {
  if (lastLock === null || lastLock !== lockHash(dir)) return true
  const lockfile = LOCKFILES.find(name => existsSync(join(dir, name)))
  const folder = lockfile ? DEPENDENCY_DIR[lockfile] : undefined
  return folder !== undefined && !existsSync(join(dir, folder))
}

/** The lines of a failed install that name an error, else its last lines. */
export function errorLines(output: string): string {
  const lines = output.split('\n').map(line => line.trim()).filter(Boolean)
  const errors = lines.filter(line => /error|ERR!|failed/i.test(line))
  return (errors.length ? errors.slice(0, 5) : lines.slice(-5)).join('\n')
}
