import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { GateResult, PackModule } from '@nook/desk/desks.ts'

import { gateHook } from '../../src/hooks/gate.ts'
import { inBackground, startedByTool } from '../../src/hooks/session.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
const calls: string[][] = []
beforeEach(() => {
  root = tempDir('nook-gate-')
  initIn(root)
  writeFileSync(join(root, 'nook.yml'), 'packs: [engineering]\n')
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
const typed = (name: string, args: string, extra: Record<string, unknown> = {}, background = false) =>
  gateHook(
    { cwd: root, session_id: 's-1', command_name: name, command_args: args, ...extra },
    { modules: [pack()], startedByTool: () => false, inBackground: () => background },
  )
const run = (args: string, extra: Record<string, unknown> = {}, modules = [pack()], nested = false) =>
  gateHook({ cwd: root, session_id: 's-1', command_name: 'nook:gate', command_args: args, ...extra }, { modules, startedByTool: () => nested })
const contextOf = (r: ReturnType<typeof run>) => (r.kind === 'json' ? (r.value.hookSpecificOutput as { additionalContext: string }).additionalContext : '')

describe('gateHook', () => {
  test('a typed /gate runs the move of the pack that owns it and gives its lines as context', () => {
    expect(contextOf(run('approve IT-1'))).toBe('Nook gate: the owner typed /gate approve IT-1. The move ran.\nIT-1 is ready\nnext: /cook IT-1')
    expect(calls).toEqual([['approve', 'IT-1']])
  })

  test('a refused move says so, with the lines of the pack', () => {
    const r = run('accept IT-1', {}, [pack({ ok: false, lines: ['accept IT-1: 1 gap'] })])
    expect(contextOf(r)).toBe('Nook gate: the owner typed /gate accept IT-1. The move was refused.\naccept IT-1: 1 gap')
  })

  test('/gate alone lists the owner moves that wait, as the commands to type', () => {
    expect(contextOf(run(''))).toBe('Nook gate: the owner moves that wait now:\n- /gate approve IT-1 (IT-1 is planning, no gap)')
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
    expect(contextOf(typed('nk-eng:auto', 'IT-1', { agent_type: 'claude' }))).toBe('Nook auto: the owner typed /auto IT-1. It ran.\nIT-1 mode auto')
    expect(calls).toEqual([['auto', 'IT-1']])
  })

  test('a session that a tool started is blocked and runs nothing', () => {
    expect(run('approve IT-1', {}, [pack()], true)).toEqual({ kind: 'block', reason: '/gate runs only in a session that the owner started, not in a session that a tool started.' })
    expect(calls).toEqual([])
  })

  test('a typed command that a pack names runs as the owner and gives its lines as context', () => {
    const r = typed('nk-eng:auto', 'IT-1 keep the old export')
    expect(contextOf(r)).toBe('Nook auto: the owner typed /auto IT-1 keep the old export. It ran.\nIT-1 mode auto')
    expect(calls).toEqual([['auto', 'IT-1 keep the old export']])
  })

  test('a typed command of a pack inside an agent is blocked and runs nothing', () => {
    expect(typed('nk-eng:auto', 'IT-1', { agent_id: 'a-1', agent_type: 'general-purpose' })).toEqual({ kind: 'block', reason: '/auto runs only from the prompt of the owner, not inside an agent.' })
    expect(calls).toEqual([])
  })

  test('a typed command in a background session says that the session edits only inside a worktree', () => {
    expect(contextOf(typed('nk-eng:auto', 'IT-1', {}, true))).toBe(
      'Nook auto: the owner typed /auto IT-1. It ran.\nIT-1 mode auto\nNook session: background. Claude Code lets this session edit only inside a worktree, so the build of an area cannot run here.',
    )
  })

  test('another command passes untouched', () => {
    expect(gateHook({ cwd: root, command_name: 'nk-eng:cook', command_args: 'IT-1' }, { modules: [pack()], startedByTool: () => false })).toEqual({ kind: 'pass' })
  })
})

describe('inBackground', () => {
  test('a background session has the spare and the pty host of Claude above it', () => {
    expect(inBackground(['/bin/sh -c hook', 'claude bg-spare --bg-spare /tmp/x.sock', 'claude bg-pty-host --bg-pty-host /tmp/x.pty', '/Users/a/.local/bin/claude daemon run'])).toBe(true)
  })

  test('a session in a terminal is not in the background', () => {
    expect(inBackground(['/bin/zsh', 'claude', '-zsh', 'login -pfl admin'])).toBe(false)
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
    expect(startedByTool(['/bin/sh -c hook', 'claude -p /nook:gate approve IT-1', '/bin/zsh -c claude -p ...', 'claude bg-spare --bg-spare /tmp/x.sock', 'claude bg-pty-host --bg-pty-host /tmp/x.pty'])).toBe(true)
  })

  test('a versioned binary of Claude counts as a Claude process', () => {
    expect(startedByTool(['/bin/sh -c hook', '/Users/a/.local/share/claude/versions/2.1.300 -p x', '/bin/bash', '/Users/a/.local/share/claude/versions/2.1.300'])).toBe(true)
  })
})
