import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { chmodSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { removeDir, tempDir } from './helpers.ts'

const SHIM = join(import.meta.dir, '..', '..', '..', 'plugin', 'bin', 'nook')

/** A copy of the shim with no nook project around it and no nook on the PATH, as in a plugin cache. */
let copy: string
let root: string
beforeEach(() => {
  root = tempDir('nook-shim-')
  mkdirSync(join(root, 'cache', 'nook', '0.1.0', 'bin'), { recursive: true })
  copy = join(root, 'cache', 'nook', '0.1.0', 'bin', 'nook')
  copyFileSync(SHIM, copy)
})
afterEach(() => removeDir(root))

const runShim = (...args: string[]) => runShimWith({}, ...args)

const runShimWith = (extra: Record<string, string>, ...args: string[]) => {
  const env: Record<string, string> = { PATH: '/usr/bin:/bin', HOME: root, ...extra }
  const result = Bun.spawnSync(['sh', copy, ...args], { env, stdout: 'pipe', stderr: 'pipe' })
  return { code: result.exitCode, err: result.stderr.toString() }
}

describe('the plugin shim with no nook binary', () => {
  test.each(['hook read', 'hook bash', 'hook edit', 'eng hook bash', 'eng hook edit', 'issues hook bash'])('the guard `%s` blocks with exit 2', call => {
    expect(runShim(...call.split(' ')).code).toBe(2)
  })

  test('a helper hook lets the call pass with exit 1', () => {
    expect(runShim('hook', 'style').code).toBe(1)
  })

  test('says how to link the binary', () => {
    expect(runShim('hook', 'read').err).toContain('ln -s <nook>/apps/nook/bin/nook ~/.local/bin/nook')
  })
})

/** A nook binary that exits with FAKE_CODE, as a nook whose own code fails to load exits 1. */
const fakeNook = () => {
  const bin = join(root, 'fake', 'apps', 'nook', 'bin')
  mkdirSync(bin, { recursive: true })
  writeFileSync(join(bin, 'nook'), '#!/bin/sh\necho "SyntaxError: x is not defined" >&2\nexit $FAKE_CODE\n')
  chmodSync(join(bin, 'nook'), 0o755)
  return join(root, 'fake')
}

describe('the plugin shim when Nook itself fails', () => {
  test('a guard blocks with exit 2 and says how the owner repairs the nook', () => {
    const result = runShimWith({ NOOK_PROJECT: fakeNook(), FAKE_CODE: '1' }, 'eng', 'hook', 'edit')
    expect(result.code).toBe(2)
    expect(result.err).toContain('Nook itself failed (exit 1), so this guard blocks the call')
    expect(result.err).toContain('! git -C')
  })

  test('the repair names bun install for a package that the nook cannot find', () => {
    const result = runShimWith({ NOOK_PROJECT: fakeNook(), FAKE_CODE: '1' }, 'hook', 'edit')
    expect(result.err).toContain("Cannot find package: ! cd")
    expect(result.err).toContain('&& bun install')
  })

  test('any other hook lets the session go on with exit 0, so a broken nook cannot hold the session', () => {
    expect(runShimWith({ NOOK_PROJECT: fakeNook(), FAKE_CODE: '1' }, 'eng', 'hook', 'stop').code).toBe(0)
  })

  test('a block of a working guard stays a block', () => {
    expect(runShimWith({ NOOK_PROJECT: fakeNook(), FAKE_CODE: '2' }, 'hook', 'bash').code).toBe(2)
  })
})
