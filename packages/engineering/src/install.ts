import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

/** The install of an area runs only when its dependencies are missing or older than its lockfile. */

const LOCKFILES = ['bun.lock', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'uv.lock', 'poetry.lock', 'Gemfile.lock', 'go.sum', 'Cargo.lock']

// the folder that a lockfile fills beside it; the others fill a cache outside the repo
const DEPENDENCY_DIR: Record<string, string> = {
  'bun.lock': 'node_modules',
  'package-lock.json': 'node_modules',
  'pnpm-lock.yaml': 'node_modules',
  'yarn.lock': 'node_modules',
  'uv.lock': '.venv',
  'poetry.lock': '.venv',
}

export const INSTALL_PREFIX = 'install: '

/** The folder and the folders above it up to the root of its git repo; only the folder when it is in no repo. */
function upToRepoRoot(dir: string): string[] {
  const chain = [dir]
  for (let current = dir; !existsSync(join(current, '.git')); ) {
    const parent = dirname(current)
    if (parent === current) return [dir]
    chain.push((current = parent))
  }
  return chain
}

/** The lockfile of a folder: the nearest one in it or above it, so a workspace member gets the lockfile of the repo. */
function lockfileOf(dir: string): string | null {
  for (const folder of upToRepoRoot(dir)) {
    const name = LOCKFILES.find(file => existsSync(join(folder, file)))
    if (name) return join(folder, name)
  }
  return null
}

/** The hash of the lockfile of the folder, or '' when it has none. */
export function lockHash(dir: string): string {
  const lockfile = lockfileOf(dir)
  return lockfile ? createHash('sha256').update(readFileSync(lockfile)).digest('hex') : ''
}

/** True when the area never installed, its lockfile changed since `lastLock`, or the folder that its lockfile fills is gone. */
export function needsInstall(dir: string, lastLock: string | null): boolean {
  if (lastLock === null || lastLock !== lockHash(dir)) return true
  const lockfile = lockfileOf(dir)
  if (!lockfile) return false
  const folder = DEPENDENCY_DIR[basename(lockfile)]
  return folder !== undefined && !existsSync(join(dirname(lockfile), folder))
}

/** The lines of a failed install that name an error, else its last lines. */
export function errorLines(output: string): string {
  const lines = output.split('\n').map(line => line.trim()).filter(Boolean)
  const errors = lines.filter(line => /error|ERR!|failed/i.test(line))
  return (errors.length ? errors.slice(0, 5) : lines.slice(-5)).join('\n')
}
