import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

/** One build of the web app for each hash of its sources and of the package sources; the stamp sits in the build. */

// at the top of apps/web: the build, the installed modules and the tests are no sources
const NOT_SOURCES = new Set(['node_modules', '.next', 'test', 'e2e'])
const GENERATED = /(\.tsbuildinfo|next-env\.d\.ts)$/

const stampOf = (root: string) => join(root, 'apps', 'web', '.next', 'nook-source')

/** The files under `dir`; a link is left out, so a link to a folder neither loops nor breaks the hash. */
function filesIn(dir: string, skip: Set<string> = new Set()): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isSymbolicLink() || skip.has(entry.name)) return []
    if (entry.isDirectory()) return filesIn(path)
    return GENERATED.test(entry.name) ? [] : [path]
  })
}

const tsconfigs = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter(name => /^tsconfig.*\.json$/.test(name)).map(name => join(dir, name)) : [])

export function sourceHash(root: string): string {
  const packages = readdirSync(join(root, 'packages'))
  const files = [
    join(root, 'bun.lock'),
    join(root, 'package.json'),
    ...tsconfigs(root),
    ...filesIn(join(root, 'apps', 'web'), NOT_SOURCES),
    ...packages.flatMap(name => {
      const dir = join(root, 'packages', name)
      return [join(dir, 'package.json'), ...tsconfigs(dir), ...filesIn(join(dir, 'src'))]
    }),
  ]
    .filter(existsSync)
    .sort()
  const hash = createHash('sha256')
  for (const file of files) hash.update(relative(root, file)).update('\0').update(readFileSync(file)).update('\0')
  return hash.digest('hex')
}

export function needsBuild(root: string): boolean {
  const stamp = stampOf(root)
  return !existsSync(stamp) || readFileSync(stamp, 'utf8') !== sourceHash(root)
}

/** Marks a build as current for `hash`: the hash of the sources taken before the build began. */
export function writeStamp(root: string, hash: string): void {
  mkdirSync(dirname(stampOf(root)), { recursive: true })
  writeFileSync(stampOf(root), hash)
}
