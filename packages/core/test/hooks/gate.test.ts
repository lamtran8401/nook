import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { GateResult, PackModule } from '@kit/env/env.ts'

import { gateHook } from '../../src/hooks/gate.ts'
import { startedByTool } from '../../src/hooks/session.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
const calls: string[][] = []
beforeEach(() => {
  root = tempDir('kit-gate-')
  initIn(root)
  writeFileSync(join(root, 'kit.yml'), 'packs: [engineering]\n')
  calls.length = 0
})
afterEach(() => removeDir(root))

const pack = (result: GateResult = { ok: true, lines: ['IT-1 is ready', 'next: /cook IT-1'] }): PackModule => ({
  name: 'engineering',
  setup: () => [],
  configured: () => true,
  doctor: () => [],
  gates: ['approve', 'accept', 'mode'],
  gate: (_dir, words) => (calls.push(words), result),
  waiting: () => [{ words: 'approve IT-1', why: 'IT-1 is planning, no gap' }],
  commands: ['auto'],
  command: (_dir, name, args) => (calls.push([name, args]), { ok: true, lines: ['IT-1 mode auto'] }),
})
const typed = (name: string, args: string, extra: Record<string, unknown> = {}) =>
  gateHook({ cwd: root, session_id: 's-1', command_name: name, command_args: args, ...extra }, { modules: [pack()], startedByTool: () => false })
const run = (args: string, extra: Record<string, unknown> = {}, modules = [pack()], nested = false) =>
  gateHook({ cwd: root, session_id: 's-1', command_name: 'kit:gate', command_args: args, ...extra }, { modules, startedByTool: () => nested })
const contextOf = (r: ReturnType<typeof run>) => (r.kind === 'json' ? (r.value.hookSpecificOutput as { additionalContext: string }).additionalContext : '')

describe('gateHook', () => {
  test('a typed /gate runs the move of the pack that owns it and gives its lines as context', () => {
    expect(contextOf(run('approve IT-1'))).toBe('Kit gate: the owner typed /gate approve IT-1. The move ran.\nIT-1 is ready\nnext: /cook IT-1')
    expect(calls).toEqual([['approve', 'IT-1']])
  })

  test('a refused move says so, with the lines of the pack', () => {
    const r = run('accept IT-1', {}, [pack({ ok: false, lines: ['accept IT-1: 1 gap'] })])
    expect(contextOf(r)).toBe('Kit gate: the owner typed /gate accept IT-1. The move was refused.\naccept IT-1: 1 gap')
  })

  test('/gate alone lists the owner moves that wait, as the commands to type', () => {
    expect(contextOf(run(''))).toBe('Kit gate: the owner moves that wait now:\n- /gate approve IT-1 (IT-1 is planning, no gap)')
    expect(calls).toEqual([])
  })

  test('a move that no pack here owns is blocked with the moves that exist', () => {
    expect(run('ship IT-1')).toEqual({ kind: 'block', reason: 'no pack here has the owner move "ship". The moves here: approve, accept, mode.' })
  })

  test('an expansion inside an agent is blocked and runs nothing', () => {
    expect(run('approve IT-1', { agent_id: 'a-1', agent_type: 'general-purpose' }).kind).toBe('block')
    expect(calls).toEqual([])
  })

  test('a main session that runs under an agent definition, as a background session, is the owner: its typed command runs', () => {
    expect(contextOf(typed('kit-engineering:auto', 'IT-1', { agent_type: 'claude' }))).toBe('Kit auto: the owner typed /auto IT-1. It ran.\nIT-1 mode auto')
    expect(calls).toEqual([['auto', 'IT-1']])
  })

  test('a session that a tool started is blocked and runs nothing', () => {
    expect(run('approve IT-1', {}, [pack()], true)).toEqual({ kind: 'block', reason: '/gate runs only in a session that the owner started, not in a session that a tool started.' })
    expect(calls).toEqual([])
  })

  test('a typed command that a pack names runs as the owner and gives its lines as context', () => {
    const r = typed('kit-engineering:auto', 'IT-1 keep the old export')
    expect(contextOf(r)).toBe('Kit auto: the owner typed /auto IT-1 keep the old export. It ran.\nIT-1 mode auto')
    expect(calls).toEqual([['auto', 'IT-1 keep the old export']])
  })

  test('a typed command of a pack inside an agent is blocked and runs nothing', () => {
    expect(typed('kit-engineering:auto', 'IT-1', { agent_id: 'a-1', agent_type: 'general-purpose' })).toEqual({ kind: 'block', reason: '/auto runs only from the prompt of the owner, not inside an agent.' })
    expect(calls).toEqual([])
  })

  test('another command passes untouched', () => {
    expect(gateHook({ cwd: root, command_name: 'kit-engineering:cook', command_args: 'IT-1' }, { modules: [pack()], startedByTool: () => false })).toEqual({ kind: 'pass' })
  })
})

describe('startedByTool', () => {
  test('a session in a terminal has no Claude process above it', () => {
    expect(startedByTool(['/bin/zsh', 'claude', '-zsh', 'login -pfl admin'])).toBe(false)
  })

  test('a background session has only the pty host and the daemon of Claude above it', () => {
    expect(startedByTool(['/bin/sh -c hook', 'claude bg-spare --bg-spare /tmp/x.sock', 'claude bg-pty-host --bg-pty-host /tmp/x.pty', '/Users/a/.local/bin/claude daemon run'])).toBe(false)
  })

  test('a session that the Bash tool of another session started reaches that session through a shell', () => {
    expect(startedByTool(['/bin/sh -c hook', 'claude -p /kit:gate approve IT-1', '/bin/zsh -c claude -p ...', 'claude bg-spare --bg-spare /tmp/x.sock', 'claude bg-pty-host --bg-pty-host /tmp/x.pty'])).toBe(true)
  })

  test('a versioned binary of Claude counts as a Claude process', () => {
    expect(startedByTool(['/bin/sh -c hook', '/Users/a/.local/share/claude/versions/2.1.300 -p x', '/bin/bash', '/Users/a/.local/share/claude/versions/2.1.300'])).toBe(true)
  })
})
