import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GitRepo } from '../src/git/repo.ts'

let dir: string
let repo: GitRepo
beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'kit-repo-')))
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
