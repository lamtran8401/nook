import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { chmodSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { removeDir, tempDir } from './helpers.ts'

const SHIM = join(import.meta.dir, '..', '..', '..', 'plugins', 'core', 'bin', 'kit')

/** A copy of the shim with no kit project around it and no kit on the PATH, as in a plugin cache. */
let copy: string
let root: string
beforeEach(() => {
  root = tempDir('kit-shim-')
  mkdirSync(join(root, 'cache', 'kit', '0.1.0', 'bin'), { recursive: true })
  copy = join(root, 'cache', 'kit', '0.1.0', 'bin', 'kit')
  copyFileSync(SHIM, copy)
})
afterEach(() => removeDir(root))

const runShim = (...args: string[]) => runShimWith({}, ...args)

const runShimWith = (extra: Record<string, string>, ...args: string[]) => {
  const env: Record<string, string> = { PATH: '/usr/bin:/bin', HOME: root, ...extra }
  const result = Bun.spawnSync(['sh', copy, ...args], { env, stdout: 'pipe', stderr: 'pipe' })
  return { code: result.exitCode, err: result.stderr.toString() }
}

describe('the plugin shim with no kit binary', () => {
  test.each(['hook read', 'hook bash', 'hook edit', 'eng hook bash', 'eng hook edit'])('the guard `%s` blocks with exit 2', call => {
    expect(runShim(...call.split(' ')).code).toBe(2)
  })

  test('a helper hook lets the call pass with exit 1', () => {
    expect(runShim('hook', 'style').code).toBe(1)
  })

  test('says how to link the binary', () => {
    expect(runShim('hook', 'read').err).toContain('ln -s <harness-kit>/apps/kit/bin/kit ~/.local/bin/kit')
  })
})

/** A kit binary that exits with FAKE_CODE, as a kit whose own code fails to load exits 1. */
const fakeKit = () => {
  const bin = join(root, 'fake', 'apps', 'kit', 'bin')
  mkdirSync(bin, { recursive: true })
  writeFileSync(join(bin, 'kit'), '#!/bin/sh\necho "SyntaxError: x is not defined" >&2\nexit $FAKE_CODE\n')
  chmodSync(join(bin, 'kit'), 0o755)
  return join(root, 'fake')
}

describe('the plugin shim when the kit itself fails', () => {
  test('a guard blocks with exit 2 and says how the owner repairs the kit', () => {
    const result = runShimWith({ KIT_PROJECT: fakeKit(), FAKE_CODE: '1' }, 'eng', 'hook', 'edit')
    expect(result.code).toBe(2)
    expect(result.err).toContain('the kit itself failed (exit 1), so this guard blocks the call')
    expect(result.err).toContain('! git -C')
  })

  test('any other hook lets the session go on with exit 0, so a broken kit cannot hold the session', () => {
    expect(runShimWith({ KIT_PROJECT: fakeKit(), FAKE_CODE: '1' }, 'eng', 'hook', 'stop').code).toBe(0)
  })

  test('a block of a working guard stays a block', () => {
    expect(runShimWith({ KIT_PROJECT: fakeKit(), FAKE_CODE: '2' }, 'hook', 'bash').code).toBe(2)
  })
})
