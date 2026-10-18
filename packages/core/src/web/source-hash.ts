import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

/** One build of the web app for each hash of its sources and of the package sources; the stamp sits in the build. */

// the build, the installed modules, the tests and the files that a build writes are no sources
const SKIP = new Set(['node_modules', '.next', 'test', 'e2e'])
const GENERATED = /(\.tsbuildinfo|next-env\.d\.ts)$/

const stampOf = (root: string) => join(root, 'apps', 'web', '.next', 'nook-source')

function filesIn(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : filesIn(path)
    return GENERATED.test(entry.name) ? [] : [path]
  })
}

export function sourceHash(root: string): string {
  const packages = readdirSync(join(root, 'packages'))
  const files = [
    join(root, 'bun.lock'),
    ...filesIn(join(root, 'apps', 'web')),
    ...packages.flatMap(name => [join(root, 'packages', name, 'package.json'), ...filesIn(join(root, 'packages', name, 'src'))]),
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

export function writeStamp(root: string): void {
  mkdirSync(dirname(stampOf(root)), { recursive: true })
  writeFileSync(stampOf(root), sourceHash(root))
}
