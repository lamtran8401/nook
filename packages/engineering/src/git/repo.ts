import { existsSync, rmSync } from 'node:fs'

/** One git checkout: the commands that the pack runs in it. */

export type GitRun = { ok: boolean; out: string; err: string }

export class GitRepo {
  constructor(readonly dir: string) {}

  run(...args: string[]): GitRun {
    const run = Bun.spawnSync(['git', ...args], {
      cwd: this.dir,
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    })
    return { ok: run.exitCode === 0, out: run.stdout.toString().trim(), err: run.stderr.toString().trim() }
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
