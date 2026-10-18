import { existsSync, rmSync } from 'node:fs'

import { runCommand } from '@nook/shared/run.ts'

/** One git checkout: the commands that the pack runs in it. */

export type GitRun = { ok: boolean; out: string; err: string }

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
