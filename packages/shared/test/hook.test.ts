import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-hook-'))
  const url = pathToFileURL(join(import.meta.dirname, '..', 'src', 'hook.ts')).href
  writeFileSync(join(dir, 'read.mjs'), `const { readInput } = await import(${JSON.stringify(url)}); console.log(JSON.stringify(await readInput()))`)
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

/** What `readInput` returns in a child process of `runtime` that gets `input` on stdin. */
function readWith(runtime: 'bun' | 'node', input: string): unknown {
  const run = spawnSync(runtime, [join(dir, 'read.mjs')], { input, encoding: 'utf8' })
  return JSON.parse(run.stdout)
}

describe('readInput', () => {
  const input = JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls é' } })

  test('parses the JSON that arrives on stdin under Bun', () => {
    expect(readWith('bun', input)).toEqual({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls é' } })
  })

  test('parses the JSON that arrives on stdin under Node', () => {
    expect(readWith('node', input)).toEqual({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls é' } })
  })

  test('an empty stdin gives an empty input', () => {
    expect(readWith('bun', '  \n')).toEqual({})
  })
})

describe('runHook and its record of the result', () => {
  test('hands the result to the recorder, and a recorder that fails leaves the block a block and names the fault', async () => {
    const { runHook, block } = await import('../src/hook.ts')
    const seen: string[] = []
    const errors: string[] = []
    const write = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((chunk: string) => (errors.push(String(chunk)), true)) as typeof process.stderr.write
    try {
      expect(await runHook(() => block('no'), true, result => seen.push(result.kind))).toBe(2)
      expect(await runHook(() => block('no'), true, () => { throw new Error('disk full') })).toBe(2)
    } finally {
      process.stderr.write = write
    }
    expect(seen).toEqual(['block'])
    expect(errors).toEqual(['no\n', 'nook: could not record the event: disk full\n', 'no\n'])
  })
})
