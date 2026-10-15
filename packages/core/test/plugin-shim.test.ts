import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { copyFileSync, mkdirSync } from 'node:fs'
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

const runShim = (...args: string[]) => {
  const env: Record<string, string> = { PATH: '/usr/bin:/bin', HOME: root }
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
