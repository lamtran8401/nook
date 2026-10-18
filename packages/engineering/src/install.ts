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

/** The lockfiles of the nearest folder that has one, in the folder or above it, so a workspace member gets those of the repo. */
function lockfilesOf(dir: string): string[] {
  for (const folder of upToRepoRoot(dir)) {
    const found = LOCKFILES.filter(file => existsSync(join(folder, file))).map(file => join(folder, file))
    if (found.length) return found
  }
  return []
}

/** The hash of the lockfiles of the folder, or '' when it has none. */
export function lockHash(dir: string): string {
  const lockfiles = lockfilesOf(dir)
  if (!lockfiles.length) return ''
  const hash = createHash('sha256')
  for (const lockfile of lockfiles) hash.update(readFileSync(lockfile))
  return hash.digest('hex')
}

/** True when the area never installed, a lockfile changed since `lastLock`, or a folder that a lockfile fills is gone. */
export function needsInstall(dir: string, lastLock: string | null): boolean {
  if (lastLock === null || lastLock !== lockHash(dir)) return true
  return lockfilesOf(dir).some(lockfile => {
    const folder = DEPENDENCY_DIR[basename(lockfile)]
    return folder !== undefined && !existsSync(join(dirname(lockfile), folder))
  })
}

/** The lines of a failed install that name an error, else its last lines. */
export function errorLines(output: string): string {
  const lines = output.split('\n').map(line => line.trim()).filter(Boolean)
  const errors = lines.filter(line => /error|ERR!|failed/i.test(line))
  return (errors.length ? errors.slice(0, 5) : lines.slice(-5)).join('\n')
}
