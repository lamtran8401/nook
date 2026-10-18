import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { runCommand } from '@nook/shared/run.ts'

/** One git checkout: the commands that the pack runs in it. */

export type GitRun = { ok: boolean; out: string; err: string }
export type FileState = 'new' | 'changed' | 'deleted' | 'moved'
export type FileChange = { path: string; state: FileState; add: number; del: number }

const STATE_OF: Record<string, FileState> = { A: 'new', M: 'changed', D: 'deleted', R: 'moved', C: 'new', T: 'changed' }
const fields = (run: GitRun) => (run.ok ? run.out.split('\0').filter(Boolean) : [])
const count = (n: string | undefined) => Number(n) || 0

export class GitRepo {
  constructor(readonly dir: string) {}

  run(...args: string[]): GitRun {
    const run = runCommand(['git', ...args], { cwd: this.dir })
    return { ok: run.code === 0, out: run.out.trim(), err: run.err.trim() }
  }

  isRepo(): boolean {
    return existsSync(this.dir) && this.run('rev-parse', '--is-inside-work-tree').ok
  }

  /** The branch of the checkout, or null on a detached HEAD. */
  branch(): string | null {
    const run = this.run('symbolic-ref', '--short', '-q', 'HEAD')
    return run.ok ? run.out : null
  }

  hasBranch(name: string): boolean {
    return this.run('rev-parse', '--verify', '-q', `refs/heads/${name}`).ok
  }

  switch(name: string, create: boolean): GitRun {
    return create ? this.run('switch', '-c', name) : this.run('switch', name)
  }

  dirtyFiles(): string[] {
    return this.isRepo() ? this.run('status', '--porcelain').out.split('\n').filter(Boolean) : []
  }

  /** The files that differ from `rev` in the working tree, the new ones that git does not track yet among them. */
  changedSince(rev: string): string[] {
    const lines = (run: GitRun) => (run.ok ? run.out.split('\n').filter(Boolean) : [])
    const changed = lines(this.run('diff', '--name-only', rev))
    const added = lines(this.run('ls-files', '--others', '--exclude-standard'))
    return [...new Set([...changed, ...added])]
  }

  mergeBase(a: string, b: string): GitRun {
    return this.run('merge-base', a, b)
  }

  /** The first of the protected branches that exists in the repo, or null. */
  mainBranch(protectedNames: string[]): string | null {
    return protectedNames.find(name => this.hasBranch(name)) ?? null
  }

  /** The merge base of HEAD and the main branch: where the work of the branch starts. */
  mainBase(protectedNames: string[]): string | null {
    const main = this.mainBranch(protectedNames)
    const base = main ? this.mergeBase('HEAD', main) : null
    return base?.ok ? base.out : null
  }

  /** Each file of the working tree that differs from `rev`, the untracked ones as new, with its added and removed lines. */
  changedFiles(rev: string): FileChange[] {
    const files = new Map<string, FileChange>()
    const status = fields(this.run('diff', '--name-status', '-M', '-z', rev))
    for (let i = 0; i < status.length; ) {
      const code = status[i++]!
      if (/^[RC]/.test(code)) i++
      const path = status[i++]!
      files.set(path, { path, state: STATE_OF[code[0]!] ?? 'changed', add: 0, del: 0 })
    }
    // a rename gives its counts with an empty path, then the old and the new path
    const numbers = fields(this.run('diff', '--numstat', '-M', '-z', rev))
    for (let i = 0; i < numbers.length; ) {
      const [add, del, path] = numbers[i++]!.split('\t')
      const name = path || (i++, numbers[i++]!)
      const file = files.get(name)
      if (file) Object.assign(file, { add: count(add), del: count(del) })
    }
    for (const path of fields(this.run('ls-files', '--others', '--exclude-standard', '-z')))
      files.set(path, { path, state: 'new', add: lineCount(join(this.dir, path)), del: 0 })
    return [...files.values()].sort((a, b) => a.path.localeCompare(b.path))
  }

  add(files: string[]): GitRun {
    return this.run('add', '-A', '--', ...files)
  }

  commit(message: string, files: string[]): GitRun {
    return this.run('commit', '-q', '-m', message, '--', ...files)
  }

  shortHead(): string {
    return this.run('rev-parse', '--short', 'HEAD').out
  }

  addWorktree(path: string, rev: string): GitRun {
    return this.run('worktree', 'add', '--detach', path, rev)
  }

  removeWorktree(path: string): void {
    if (!existsSync(path)) return
    this.run('worktree', 'remove', '--force', path)
    rmSync(path, { recursive: true, force: true })
    this.run('worktree', 'prune')
  }
}

function lineCount(file: string): number {
  const text = readFileSync(file, 'utf8')
  if (!text) return 0
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0)
}
