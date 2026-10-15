import { copyFileSync, existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

import { STATE_DIR } from '@kit/env/env.ts'
import { EvError, Exit, refused, usage } from '@kit/shared/errors.ts'

import { write } from './db.ts'
import { type Area, areaDir, areaNamed } from './home.ts'
import type { Kit } from './kit.ts'
import { areaInUse } from './model/guards.ts'
import { getItem, type Item, recordEvent } from './model/items.ts'
import { getSlice, liveSlices, recordProof, type Slice } from './model/slices.ts'
import { assertCan } from './role.ts'

/** Git for the areas: the branch of an item, one commit for each done slice, the proof of a slice on the base. */

export type Run = { ok: boolean; out: string; err: string }

export function git(dir: string, ...args: string[]): Run {
  const run = Bun.spawnSync(['git', ...args], { cwd: dir, stdout: 'pipe', stderr: 'pipe', env: process.env })
  return { ok: run.exitCode === 0, out: run.stdout.toString().trim(), err: run.stderr.toString().trim() }
}

export const isRepo = (dir: string) => existsSync(dir) && git(dir, 'rev-parse', '--is-inside-work-tree').ok

export function currentBranch(dir: string): string | null {
  const run = git(dir, 'symbolic-ref', '--short', '-q', 'HEAD')
  return run.ok ? run.out : null
}

export const dirtyFiles = (dir: string) => (isRepo(dir) ? git(dir, 'status', '--porcelain').out.split('\n').filter(Boolean) : [])

const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
export const branchName = (item: Item) => `kit/${item.id}-${slug(item.title) || 'work'}`

/** The git areas of an item: `git: true` and a repo on disk. */
export function gitAreas(kit: Kit, item: Item): Area[] {
  return item.areas.map(name => areaNamed(kit.home, name)).filter(area => area.git && isRepo(areaDir(kit.home, area)))
}

export type BranchResult = { area: string; branch: string; made: boolean }

/** `item branch`: kit/<id>-<slug> in each git area, switched to. */
export function branchItem(kit: Kit, id: string): BranchResult[] {
  assertCan(kit.who, 'item branch')
  const item = getItem(kit, id)
  const areas = gitAreas(kit, item)
  if (!areas.length) throw refused(`${id} has no git area`, `kit eng item edit ${id} areas <a,b>, with git: true in kit.yml`)
  const branch = branchName(item)
  if (kit.home.config.protected.includes(branch)) throw refused(`${branch} is a protected branch`, 'change the title, or the protected list of kit.yml')
  for (const area of areas) {
    const other = areaInUse(kit, item, area.name)
    if (other) throw refused(`area ${area.name} is in use by ${other.id}`, `wait for ${other.id}, or move ${id} to another area`)
  }
  const results: BranchResult[] = []
  for (const area of areas) {
    const dir = areaDir(kit.home, area)
    if (currentBranch(dir) === branch) {
      results.push({ area: area.name, branch, made: false })
      continue
    }
    const exists = git(dir, 'rev-parse', '--verify', '-q', `refs/heads/${branch}`).ok
    const run = exists ? git(dir, 'switch', branch) : git(dir, 'switch', '-c', branch)
    if (!run.ok) throw new EvError(`area ${area.name}: git switch failed: ${run.err}`, Exit.error, 'commit or stash the changes of the area, then run this again')
    results.push({ area: area.name, branch, made: !exists })
  }
  write(kit.db, () => recordEvent(kit, id, 'branch', { reason: `${branch} in ${results.map(r => r.area).join(', ')}` }))
  return results
}

export type CommitEntry = { slice: string; area: string; dir: string; branch: string | null; files: string[]; message: string; commit?: string }
export type CommitPlan = { entries: CommitEntry[]; skipped: string[] }

/** One commit for each done slice from its recorded files. Never a push. */
export function commitPlan(kit: Kit, id: string): CommitPlan {
  assertCan(kit.who, 'item commit')
  const item = getItem(kit, id)
  if (!['cooking', 'checking', 'done'].includes(item.state)) throw refused(`${id} is ${item.state}: commits come from cooking, checking or done`, `kit eng next ${id}`)
  const plan: CommitPlan = { entries: [], skipped: [] }
  for (const slice of liveSlices(kit, id).filter(s => s.state === 'done')) {
    const area = areaNamed(kit.home, slice.area)
    const dir = areaDir(kit.home, area)
    if (!area.git || !isRepo(dir)) {
      plan.skipped.push(`${slice.id}: area ${area.name} is not a git area`)
      continue
    }
    if (!slice.files.length) {
      plan.skipped.push(`${slice.id} has no files recorded: kit eng task done ${id} ${slice.id} --files <f...>`)
      continue
    }
    const files = slice.files.map(f => inArea(kit, dir, area, f))
    plan.entries.push({ slice: slice.id, area: area.name, dir, branch: currentBranch(dir), files, message: `${id} ${slice.id}: ${slice.title}` })
  }
  return plan
}

/** A recorded file, relative to the area folder. Paths come from the home, the area or absolute. */
function inArea(kit: Kit, dir: string, area: Area, file: string): string {
  const candidates = (isAbsolute(file) ? [file] : [resolve(dir, file), resolve(kit.home.dir, file)]).filter(c => !relative(dir, c).startsWith('..'))
  const inside = candidates.find(c => existsSync(c)) ?? candidates[0]
  if (!inside) throw refused(`file ${file} is outside area ${area.name}`, 'record files of the area only')
  return relative(dir, inside)
}

export function commitItem(kit: Kit, id: string): CommitPlan {
  const plan = commitPlan(kit, id)
  for (const entry of plan.entries) {
    if (!entry.branch || kit.home.config.protected.includes(entry.branch)) throw refused(`area ${entry.area} is on ${entry.branch ?? 'no branch'}: a commit goes on the item branch, not a protected one`, `kit eng item branch ${id}`)
  }
  for (const entry of plan.entries) {
    const add = git(entry.dir, 'add', '-A', '--', ...entry.files)
    if (!add.ok) throw new EvError(`${entry.slice}: git add failed: ${add.err}`)
    const commit = git(entry.dir, 'commit', '-q', '-m', entry.message, '--', ...entry.files)
    if (!commit.ok) throw new EvError(`${entry.slice}: git commit failed: ${commit.err || commit.out}`, Exit.error, 'nothing to commit? check git status in the area')
    entry.commit = git(entry.dir, 'rev-parse', '--short', 'HEAD').out
  }
  write(kit.db, () => recordEvent(kit, id, 'commit', { reason: plan.entries.map(e => `${e.slice} ${e.commit}`).join(', ') || 'nothing to commit' }))
  return plan
}

export type Proof = { slice: string; proof: Slice['proof']; note: string; tests: string[] }

export const isTestFile = (file: string) =>
  /(^|\/)(tests?|__tests__|spec)\//.test(file) || /\.(test|spec)\.[^/]+$/.test(file) || /_test\.[^/]+$/.test(file) || /(^|\/)test_[^/]+\.py$/.test(file)

/** The test did not run: a missing module, an import, a compile or a type error. */
const LOAD_ERROR = /Cannot find module|Failed to resolve import|Module not found|ModuleNotFoundError|ImportError|SyntaxError|error TS\d+|cannot find package|is not a function|is not defined|has no exported member|does not provide an export|No such file or directory/

const DEPENDENCIES = ['node_modules', '.venv', 'venv', 'vendor']
const PROVE_LIMIT_MS = 4 * 60 * 1000

/**
 * `task prove`: the new tests of a slice run on the base of the branch, with no code of the slice. A failure there
 * proves the tests (`proven`); a pass means they cannot fail (`weak`); a load error means they did not run (`none`).
 */
export function prove(kit: Kit, id: string, sliceId: string, files: string[]): Proof {
  assertCan(kit.who, 'task prove')
  const item = getItem(kit, id)
  const slice = getSlice(kit, id, sliceId)
  if (!['cooking', 'checking'].includes(item.state)) throw refused(`${id} is ${item.state}: a slice is proven in cooking or checking`, `kit eng next ${id}`)
  const area = areaNamed(kit.home, slice.area)
  const dir = areaDir(kit.home, area)
  const list = files.length ? files : slice.files
  if (!list.length) throw usage(`${slice.id} has no files yet`, `kit eng task prove ${id} ${slice.id} --files <f...>`)
  if (slice.proof === 'skipped') return store(kit, id, slice.id, 'skipped', slice.proof_note ?? 'tasks.md marks the slice as proof: none', [])
  const tests = list.map(f => inArea(kit, dir, area, f)).filter(isTestFile)
  if (!tests.length) return store(kit, id, slice.id, 'none', 'the slice has no test file', [])
  if (!area.test) throw refused(`area ${area.name} has no \`test\` command in kit.yml`, `add test: "<command> {files}" to the area`)
  if (!area.git || !isRepo(dir)) throw refused(`area ${area.name} is not a git repo, so there is no base to prove on`, 'set git: true and make the folder a repo')
  const base = mergeBase(kit, dir)
  const copy = join(kit.home.dir, STATE_DIR, 'prove', `${id}-${slice.id}`)
  removeWorktree(dir, copy)
  mkdirSync(dirname(copy), { recursive: true })
  const added = git(dir, 'worktree', 'add', '--detach', copy, base)
  if (!added.ok) throw new EvError(`cannot make a worktree of ${area.name} at ${base.slice(0, 8)}: ${added.err}`)
  try {
    for (const test of tests) {
      mkdirSync(dirname(join(copy, test)), { recursive: true })
      copyFileSync(join(dir, test), join(copy, test))
    }
    for (const name of DEPENDENCIES) if (existsSync(join(dir, name)) && !existsSync(join(copy, name))) symlinkSync(join(dir, name), join(copy, name), 'dir')
    const command = area.test.replace('{files}', tests.map(t => `'${t.replaceAll("'", `'\\''`)}'`).join(' '))
    const run = Bun.spawnSync(['sh', '-c', command], { cwd: copy, env: { ...process.env, CI: 'true' }, timeout: PROVE_LIMIT_MS, stdout: 'pipe', stderr: 'pipe' })
    const output = `${run.stdout.toString()}${run.stderr.toString()}`
    const [proof, note] = classify(run.exitCode ?? 1, output)
    return store(kit, id, slice.id, proof, note, tests)
  } finally {
    removeWorktree(dir, copy)
  }
}

export function classify(exitCode: number, output: string): [Slice['proof'], string] {
  if (exitCode === 0) return ['weak', 'the tests pass on the base, with no code of the slice: they cannot fail']
  const load = LOAD_ERROR.exec(output)
  if (load) return ['none', `the tests did not run on the base (${load[0]}): ${firstLines(output.slice(Math.max(0, load.index - 80)))}`]
  return ['proven', `the tests fail on the base: ${firstLines(output)}`]
}

const firstLines = (output: string) => output.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3).join(' | ').slice(0, 300)

/** The merge base of HEAD and the first protected branch that exists in the repo. */
function mergeBase(kit: Kit, dir: string): string {
  const protectedBranch = kit.home.config.protected.find(name => git(dir, 'rev-parse', '--verify', '-q', `refs/heads/${name}`).ok)
  if (!protectedBranch) throw refused(`no protected branch exists in the repo (${kit.home.config.protected.join(', ')})`, 'name the main branch of the area in `protected` of kit.yml')
  const base = git(dir, 'merge-base', 'HEAD', protectedBranch)
  if (!base.ok) throw new EvError(`git merge-base failed: ${base.err}`)
  return base.out
}

function removeWorktree(dir: string, copy: string): void {
  if (!existsSync(copy)) return
  git(dir, 'worktree', 'remove', '--force', copy)
  rmSync(copy, { recursive: true, force: true })
  git(dir, 'worktree', 'prune')
}

function store(kit: Kit, id: string, sliceId: string, proof: Slice['proof'], note: string, tests: string[]): Proof {
  write(kit.db, () => recordProof(kit, id, sliceId, proof, note))
  return { slice: sliceId, proof, note, tests }
}
