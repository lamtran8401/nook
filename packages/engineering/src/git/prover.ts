import { copyFileSync, existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { EvError, refused } from '@kit/shared/errors.ts'

import type { Area } from '../config.ts'
import type { Home } from '../home.ts'
import { runShell } from '../shell.ts'
import type { Proof } from '../vocabulary.ts'
import { GitRepo } from './repo.ts'

/**
 * The proof of a slice: its new tests run on the base of the branch, with no code of the slice.
 * A failure proves the tests (`proven`); a pass means they cannot fail (`weak`); a load error, `none`.
 */

export type ProofResult = { proof: Proof; note: string }

export const isTestFile = (file: string) =>
  /(^|\/)(tests?|__tests__|spec)\//.test(file) ||
  /\.(test|spec)\.[^/]+$/.test(file) ||
  /_test\.[^/]+$/.test(file) ||
  /(^|\/)test_[^/]+\.py$/.test(file)

/** The test did not run: a missing module, an import, a compile or a type error. */
const LOAD_ERROR =
  /Cannot find module|Failed to resolve import|Module not found|ModuleNotFoundError|ImportError|SyntaxError|error TS\d+|cannot find package|is not a function|is not defined|has no exported member|does not provide an export|No such file or directory/

const DEPENDENCIES = ['node_modules', '.venv', 'venv', 'vendor']
const PROVE_LIMIT_MS = 4 * 60 * 1000

const firstLines = (output: string) =>
  output
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ')
    .slice(0, 300)

export function classify(exitCode: number, output: string): ProofResult {
  if (exitCode === 0)
    return { proof: 'weak', note: 'the tests pass on the base, with no code of the slice: they cannot fail' }
  const load = LOAD_ERROR.exec(output)
  if (load)
    return {
      proof: 'none',
      note: `the tests did not run on the base (${load[0]}): ${firstLines(output.slice(Math.max(0, load.index - 80)))}`,
    }
  return { proof: 'proven', note: `the tests fail on the base: ${firstLines(output)}` }
}

const quote = (file: string) => `'${file.replaceAll("'", `'\\''`)}'`

export class Prover {
  private readonly repo: GitRepo

  constructor(
    private readonly home: Home,
    private readonly area: Area,
  ) {
    this.repo = new GitRepo(home.areaDir(area))
  }

  /** Runs `tests` (paths in the area) in a worktree `name` at the base, then removes it. */
  prove(name: string, tests: string[], test: string): ProofResult {
    const base = this.mergeBase()
    const copy = join(this.home.stateDir, 'prove', name)
    this.repo.removeWorktree(copy)
    mkdirSync(dirname(copy), { recursive: true })
    const added = this.repo.addWorktree(copy, base)
    if (!added.ok)
      throw new EvError(`cannot make a worktree of ${this.area.name} at ${base.slice(0, 8)}: ${added.err}`)
    try {
      this.prepare(copy, tests)
      const run = runShell(test.replace('{files}', tests.map(quote).join(' ')), copy, PROVE_LIMIT_MS)
      return classify(run.code, run.output)
    } finally {
      this.repo.removeWorktree(copy)
    }
  }

  /** The new tests go into the copy; the installed dependencies of the area are linked, not installed. */
  private prepare(copy: string, tests: string[]): void {
    for (const test of tests) {
      mkdirSync(dirname(join(copy, test)), { recursive: true })
      copyFileSync(join(this.repo.dir, test), join(copy, test))
    }
    for (const name of DEPENDENCIES) {
      if (existsSync(join(this.repo.dir, name)) && !existsSync(join(copy, name)))
        symlinkSync(join(this.repo.dir, name), join(copy, name), 'dir')
    }
  }

  /** The merge base of HEAD and the first protected branch that exists in the repo. */
  private mergeBase(): string {
    const config = this.home.config
    const main = config.protected.find(name => this.repo.hasBranch(name))
    if (!main)
      throw refused(
        `no protected branch exists in the repo (${config.protected.join(', ')})`,
        'name the main branch of the area in `protected` of kit.yml',
      )
    const base = this.repo.mergeBase('HEAD', main)
    if (!base.ok) throw new EvError(`git merge-base failed: ${base.err}`)
    return base.out
  }
}
