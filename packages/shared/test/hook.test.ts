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
