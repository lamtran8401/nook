import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { hookRecorder, maskSecrets, readEvents, recordEvent } from '../src/events.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-events-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const workspace = (dir: string) => (mkdirSync(dir, { recursive: true }), writeFileSync(join(dir, 'nook.yml'), 'secrets: []\n'))
const NOW = new Date(2026, 9, 19, 9, 30)
const AT = NOW.toISOString()
const dayFile = (dir: string, day = '2026-10-19') => join(dir, '.nook', 'events', `${day}.jsonl`)
const lines = (dir: string, day?: string) => readFileSync(dayFile(dir, day), 'utf8').trim().split('\n').map(line => JSON.parse(line))

describe('maskSecrets', () => {
  test('puts [secret] in place of a token, a key and a password, and keeps the rest', () => {
    expect(maskSecrets('use ghp_abcdefghijklmnopqrstuvwx1234 and password=hunter2 now')).toBe('use [secret] and password=[secret] now')
    expect(maskSecrets('AKIAABCDEFGHIJKLMNOP sk-ant-api03-abcdefghijklmnopqrstuv ATATT3xFfGF0abcdefghijklmnopqrstu')).toBe('[secret] [secret] [secret]')
    expect(maskSecrets('jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.abcdefghijklmnop end')).toBe('jwt [secret] end')
    expect(maskSecrets('-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----')).toBe('[secret]')
    expect(maskSecrets('commit 1c267d0 of SHOP-12, token: abc123')).toBe('commit 1c267d0 of SHOP-12, token: [secret]')
  })
})

describe('the event log of a workspace', () => {
  const block = { kind: 'block' as const, reason: 'the reviewer is read-only: may not run `date`.' }

  test('a block of a hook writes one line to the file of its day in the log of the nearest workspace, the command masked', () => {
    workspace(root)
    mkdirSync(join(root, 'shop'))
    const input = { cwd: join(root, 'shop'), session_id: 's1', agent_type: 'nk-eng:reviewer', tool_name: 'Bash', tool_input: { command: 'date && echo ghp_abcdefghijklmnopqrstuvwx1234' } }
    hookRecorder(input, 'eng bash', NOW)(block)
    expect(lines(root)).toEqual([{ at: AT, kind: 'block', session: 's1', hook: 'eng bash', agent: 'nk-eng:reviewer', tool: 'Bash', reason: 'the reviewer is read-only: may not run `date`.', command: 'date && echo [secret]' }])
  })

  test('the lead is the agent of an event with no agent type; an edit names its file; a long command keeps 200 characters', () => {
    workspace(root)
    hookRecorder({ cwd: root, tool_name: 'Edit', tool_input: { file_path: '.nook/x.db' } }, 'core edit', NOW)(block)
    hookRecorder({ cwd: root, tool_name: 'Bash', tool_input: { command: `ls ${'a'.repeat(300)}` } }, 'core bash', NOW)(block)
    const [edit, long] = lines(root)
    expect([edit.agent, edit.command]).toEqual(['lead', '.nook/x.db'])
    expect(long.command).toHaveLength(200)
  })

  test('a hook that lets the call pass writes nothing', () => {
    workspace(root)
    hookRecorder({ cwd: root, tool_name: 'Bash', tool_input: { command: 'ls' } }, 'core bash', NOW)({ kind: 'pass' })
    expect(existsSync(dayFile(root))).toBe(false)
  })

  test('a workspace inside a workspace keeps its own log; a folder that is no workspace keeps none', () => {
    workspace(root)
    workspace(join(root, 'shop'))
    recordEvent(join(root, 'shop'), { kind: 'prompt', text: 'hello' }, NOW)
    expect(lines(join(root, 'shop'))).toEqual([{ at: AT, kind: 'prompt', text: 'hello' }])
    expect(existsSync(dayFile(root))).toBe(false)
    const loose = realpathSync(mkdtempSync(join(tmpdir(), 'nook-loose-')))
    recordEvent(loose, { kind: 'prompt', text: 'hello' }, NOW)
    expect(existsSync(join(loose, '.nook'))).toBe(false)
    rmSync(loose, { recursive: true, force: true })
  })

  test('a log that cannot be written throws, so the hook can name the fault', () => {
    workspace(root)
    writeFileSync(join(root, '.nook'), 'not a folder')
    expect(() => recordEvent(root, { kind: 'prompt', text: 'hello' }, NOW)).toThrow()
  })

  test('reads the events of a kind since a time across the files of the days, oldest first, and skips a broken line', () => {
    workspace(root)
    recordEvent(root, { kind: 'prompt', text: 'old' }, new Date(2026, 8, 30, 10))
    recordEvent(root, { kind: 'block', reason: 'r' }, new Date(2026, 9, 2, 10))
    recordEvent(root, { kind: 'prompt', text: 'new' }, new Date(2026, 9, 3, 10))
    expect(readdirSync(join(root, '.nook', 'events')).sort()).toEqual(['2026-09-30.jsonl', '2026-10-02.jsonl', '2026-10-03.jsonl'])
    writeFileSync(dayFile(root, '2026-10-03'), '{broken\n', { flag: 'a' })
    expect(readEvents(root, { kind: 'prompt', since: new Date(2026, 9, 1) }).map(e => e.text)).toEqual(['new'])
    expect(readEvents(root).map(e => e.kind)).toEqual(['prompt', 'block', 'prompt'])
  })

  test('a hook that throws writes an error event with its message, also when the result is a block of the failed guard', () => {
    workspace(root)
    const input = { cwd: root, tool_name: 'Bash', tool_input: { command: 'ls' } }
    hookRecorder(input, 'core start', NOW)({ kind: 'pass' }, new Error('cannot read nook.yml'))
    hookRecorder(input, 'core bash', NOW)({ kind: 'block', reason: 'the guard failed, so the call is blocked: boom' }, new Error('boom'))
    expect(lines(root).map(e => [e.kind, e.hook, e.reason])).toEqual([['error', 'core start', 'cannot read nook.yml'], ['error', 'core bash', 'boom']])
  })
})
