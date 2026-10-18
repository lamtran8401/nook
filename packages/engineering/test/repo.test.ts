import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GitRepo } from '../src/git/repo.ts'

let dir: string
let repo: GitRepo
beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'nook-repo-')))
  repo = new GitRepo(dir)
  repo.run('init', '-q')
  writeFileSync(join(dir, 'a.ts'), 'one\n')
  writeFileSync(join(dir, 'c.ts'), 'same\n')
  repo.run('add', '.')
  repo.run('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('GitRepo.changedSince', () => {
  test('lists the changed files and the new untracked ones, and not the files that stay the same', () => {
    const base = repo.run('rev-parse', 'HEAD').out
    writeFileSync(join(dir, 'a.ts'), 'two\n')
    writeFileSync(join(dir, 'b.ts'), 'new\n')
    expect(repo.changedSince(base).sort()).toEqual(['a.ts', 'b.ts'])
  })
})

describe('GitRepo.changedFiles', () => {
  test('gives each file that differs from the base, with its state and its added and removed lines', () => {
    const base = repo.run('rev-parse', 'HEAD').out
    writeFileSync(join(dir, 'a.ts'), 'one\ntwo\nthree\n')
    writeFileSync(join(dir, 'd.ts'), 'tracked\nnew\n')
    repo.run('add', 'd.ts')
    repo.run('rm', '-q', 'c.ts')
    writeFileSync(join(dir, 'e.ts'), 'untracked\nfile\nhere\n')
    expect(repo.changedFiles(base)).toEqual([
      { path: 'a.ts', state: 'changed', add: 2, del: 0 },
      { path: 'c.ts', state: 'deleted', add: 0, del: 1 },
      { path: 'd.ts', state: 'new', add: 2, del: 0 },
      { path: 'e.ts', state: 'new', add: 3, del: 0 },
    ])
  })

  test('marks a renamed file as moved, under its new path', () => {
    const base = repo.run('rev-parse', 'HEAD').out
    repo.run('mv', 'c.ts', 'moved.ts')
    expect(repo.changedFiles(base)).toEqual([{ path: 'moved.ts', state: 'moved', add: 0, del: 0 }])
  })
})

describe('GitRepo.mainBase', () => {
  test('is the merge base of HEAD and the first protected branch that exists', () => {
    const main = repo.branch()!
    const base = repo.run('rev-parse', 'HEAD').out
    repo.run('switch', '-q', '-c', 'nook/SHOP-1-x')
    writeFileSync(join(dir, 'a.ts'), 'branch\n')
    repo.run('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'work')
    expect(repo.mainBase(['develop', main])).toBe(base)
  })

  test('is null when no protected branch exists', () => {
    expect(repo.mainBase(['develop'])).toBeNull()
  })
})
