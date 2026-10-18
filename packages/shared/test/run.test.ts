import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runCommand } from '../src/run.ts'

let dir: string
beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'nook-run-')))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('runCommand', () => {
  test('returns the output, the error output and the exit code of the program', () => {
    expect(runCommand(['sh', '-c', 'echo out; echo err >&2; exit 3'])).toEqual({ code: 3, out: 'out\n', err: 'err\n' })
  })

  test('runs the program in the folder that cwd names', () => {
    expect(runCommand(['pwd'], { cwd: dir }).out).toBe(`${dir}\n`)
  })

  test('passes the environment that env names', () => {
    expect(runCommand(['sh', '-c', 'echo $NOOK_RUN_TEST'], { env: { ...process.env, NOOK_RUN_TEST: 'set' } }).out).toBe('set\n')
  })

  test('a program over its time limit stops and counts as a failure', () => {
    const start = Date.now()
    const run = runCommand(['sleep', '5'], { timeoutMs: 200 })
    expect(run.code).not.toBe(0)
    expect(Date.now() - start).toBeLessThan(3000)
  })

  test('keeps an output larger than 1 MB whole', () => {
    expect(runCommand(['sh', '-c', 'head -c 3000000 /dev/zero | tr "\\0" a']).out.length).toBe(3_000_000)
  })

  test('a missing program counts as a failure and names the program', () => {
    const run = runCommand(['nook-no-such-program'])
    expect(run.code).not.toBe(0)
    expect(run.err).toContain('nook-no-such-program')
  })
})
