import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { hookRecorder, maskSecrets, readEvents, recordEvent } from '../src/events.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-events-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const desk = (dir: string) => (mkdirSync(dir, { recursive: true }), writeFileSync(join(dir, 'nook.yml'), 'packs: [core]\n'))
const lines = (dir: string) => readFileSync(join(dir, '.nook', 'events.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
const NOW = new Date('2026-10-19T09:30:00Z')

describe('maskSecrets', () => {
  test('puts [secret] in place of a token, a key and a password, and keeps the rest', () => {
    expect(maskSecrets('use ghp_abcdefghijklmnopqrstuvwx1234 and password=hunter2 now')).toBe('use [secret] and password=[secret] now')
    expect(maskSecrets('AKIAABCDEFGHIJKLMNOP sk-ant-api03-abcdefghijklmnopqrstuv ATATT3xFfGF0abcdefghijklmnopqrstu')).toBe('[secret] [secret] [secret]')
    expect(maskSecrets('jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.abcdefghijklmnop end')).toBe('jwt [secret] end')
    expect(maskSecrets('-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----')).toBe('[secret]')
    expect(maskSecrets('commit 1c267d0 of SHOP-12, token: abc123')).toBe('commit 1c267d0 of SHOP-12, token: [secret]')
  })
})

describe('the event log of a desk', () => {
  const block = { kind: 'block' as const, reason: 'the reviewer is read-only: may not run `date`.' }

  test('a block of a hook writes one line to the log of the nearest desk, the command masked', () => {
    desk(root)
    mkdirSync(join(root, 'shop'))
    const input = { cwd: join(root, 'shop'), session_id: 's1', agent_type: 'nk-eng:reviewer', tool_name: 'Bash', tool_input: { command: 'date && echo ghp_abcdefghijklmnopqrstuvwx1234' } }
    hookRecorder(input, 'eng bash', NOW)(block)
    expect(lines(root)).toEqual([{ at: '2026-10-19T09:30:00.000Z', kind: 'block', session: 's1', hook: 'eng bash', agent: 'nk-eng:reviewer', tool: 'Bash', reason: 'the reviewer is read-only: may not run `date`.', command: 'date && echo [secret]' }])
  })

  test('the lead is the agent of an event with no agent type; an edit names its file; a long command keeps 200 characters', () => {
    desk(root)
    hookRecorder({ cwd: root, tool_name: 'Edit', tool_input: { file_path: '.nook/x.db' } }, 'core edit', NOW)(block)
    hookRecorder({ cwd: root, tool_name: 'Bash', tool_input: { command: `ls ${'a'.repeat(300)}` } }, 'core bash', NOW)(block)
    const [edit, long] = lines(root)
    expect([edit.agent, edit.command]).toEqual(['lead', '.nook/x.db'])
    expect(long.command).toHaveLength(200)
  })

  test('a hook that lets the call pass writes nothing', () => {
    desk(root)
    hookRecorder({ cwd: root, tool_name: 'Bash', tool_input: { command: 'ls' } }, 'core bash', NOW)({ kind: 'pass' })
    expect(existsSync(join(root, '.nook', 'events.jsonl'))).toBe(false)
  })

  test('a desk inside a desk keeps its own log; a folder that is no desk keeps none', () => {
    desk(root)
    desk(join(root, 'shop'))
    recordEvent(join(root, 'shop'), { kind: 'prompt', text: 'hello' }, NOW)
    expect(lines(join(root, 'shop'))).toEqual([{ at: '2026-10-19T09:30:00.000Z', kind: 'prompt', text: 'hello' }])
    expect(existsSync(join(root, '.nook', 'events.jsonl'))).toBe(false)
    const loose = realpathSync(mkdtempSync(join(tmpdir(), 'nook-loose-')))
    recordEvent(loose, { kind: 'prompt', text: 'hello' }, NOW)
    expect(existsSync(join(loose, '.nook'))).toBe(false)
    rmSync(loose, { recursive: true, force: true })
  })

  test('a log that cannot be written throws, so the hook can name the fault', () => {
    desk(root)
    writeFileSync(join(root, '.nook'), 'not a folder')
    expect(() => recordEvent(root, { kind: 'prompt', text: 'hello' }, NOW)).toThrow()
  })

  test('reads the events of a kind since a time, oldest first, and skips a broken line', () => {
    desk(root)
    recordEvent(root, { kind: 'prompt', text: 'old' }, new Date('2026-09-30T10:00:00Z'))
    recordEvent(root, { kind: 'block', reason: 'r' }, new Date('2026-10-02T10:00:00Z'))
    recordEvent(root, { kind: 'prompt', text: 'new' }, new Date('2026-10-03T10:00:00Z'))
    writeFileSync(join(root, '.nook', 'events.jsonl'), '{broken\n', { flag: 'a' })
    expect(readEvents(root, { kind: 'prompt', since: new Date('2026-10-01T00:00:00Z') }).map(e => e.text)).toEqual(['new'])
    expect(readEvents(root).map(e => e.kind)).toEqual(['prompt', 'block', 'prompt'])
  })
})
