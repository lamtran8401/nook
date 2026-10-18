import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { errorLines, lockHash, needsInstall } from '../src/install.ts'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-install-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('lockHash', () => {
  test('is the sha256 of the lockfile text', () => {
    writeFileSync(join(dir, 'uv.lock'), 'abc')
    expect(lockHash(dir)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  test('is empty for a folder with no lockfile', () => {
    expect(lockHash(dir)).toBe('')
  })
})

describe('needsInstall', () => {
  test('is true for an area that never installed', () => {
    expect(needsInstall(dir, null)).toBe(true)
  })

  test('is true when the lockfile changed since the last install', () => {
    writeFileSync(join(dir, 'bun.lock'), 'v2')
    mkdirSync(join(dir, 'node_modules'))
    expect(needsInstall(dir, 'the hash of v1')).toBe(true)
  })

  test('is true when the folder that the lockfile fills is gone', () => {
    writeFileSync(join(dir, 'bun.lock'), 'v1')
    expect(needsInstall(dir, lockHash(dir))).toBe(true)
  })

  test('is false for the same lockfile with its folder in place', () => {
    writeFileSync(join(dir, 'bun.lock'), 'v1')
    mkdirSync(join(dir, 'node_modules'))
    expect(needsInstall(dir, lockHash(dir))).toBe(false)
  })

  test('is false for the same lockfile of a tool that fills no folder in the area', () => {
    writeFileSync(join(dir, 'go.sum'), 'v1')
    expect(needsInstall(dir, lockHash(dir))).toBe(false)
  })
})

describe('errorLines', () => {
  test('keeps the lines that name an error', () => {
    expect(errorLines('resolving\nerror: no network\nretry\nnpm ERR! code E404\n')).toBe('error: no network\nnpm ERR! code E404')
  })

  test('falls back to the last lines when no line names an error', () => {
    expect(errorLines('1\n2\n3\n4\n5\n6\n')).toBe('2\n3\n4\n5\n6')
  })
})
