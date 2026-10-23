import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Pairs } from '../../src/web/pairs.ts'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

let workspace: string
let clock: number
const pairs = () => {
  let n = 0
  return new Pairs(workspace, { now: () => clock, newSecret: () => `secret-${++n}` })
}
const file = () => join(workspace, '.nook', 'web-pairs.json')

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'nook-pairs-'))
  clock = 1_000_000
})
afterEach(() => rmSync(workspace, { recursive: true, force: true }))

describe('Pairs', () => {
  test('a pair token gives a session once, and the session holds', () => {
    const p = pairs()
    const token = p.offer()
    const session = p.redeem(token)
    expect(session).toBe('secret-2')
    expect(p.holds('secret-2')).toBe(true)
    expect(p.redeem(token)).toBeNull()
  })

  test('a token that waited more than 2 minutes gives no session', () => {
    const p = pairs()
    const token = p.offer()
    clock += 2 * MINUTE + 1
    expect(p.redeem(token)).toBeNull()
  })

  test('a session holds for 30 days, also for a new reader of the file, as after a restart', () => {
    const p = pairs()
    p.redeem(p.offer())
    const later = new Pairs(workspace, { now: () => clock })
    clock += 30 * DAY
    expect(later.holds('secret-2')).toBe(true)
    clock += 1
    expect(later.holds('secret-2')).toBe(false)
  })

  test('an unknown session or token, and an empty one, holds nothing', () => {
    const p = pairs()
    p.redeem(p.offer())
    expect(p.holds('secret-9')).toBe(false)
    expect(p.holds('')).toBe(false)
    expect(p.redeem('')).toBeNull()
    expect(p.redeem('secret-9')).toBeNull()
  })

  test('the file holds only hashes, and only the owner can read it', () => {
    const p = pairs()
    p.redeem(p.offer())
    p.offer()
    const text = readFileSync(file(), 'utf8')
    expect(text).not.toContain('secret-')
    expect(JSON.parse(text)).toEqual({
      tokens: [{ hash: expect.stringMatching(/^[0-9a-f]{64}$/), expires: 1_000_000 + 2 * MINUTE }],
      sessions: [{ hash: expect.stringMatching(/^[0-9a-f]{64}$/), expires: 1_000_000 + 30 * DAY }],
    })
    expect(statSync(file()).mode & 0o777).toBe(0o600)
  })

  test('a write drops each token and session that ended', () => {
    const p = pairs()
    p.redeem(p.offer())
    p.offer()
    clock += 31 * DAY
    p.offer()
    expect(JSON.parse(readFileSync(file(), 'utf8'))).toEqual({ tokens: [{ hash: expect.any(String), expires: clock + 2 * MINUTE }], sessions: [] })
  })

  test('forget removes each session and token, and gives the number of sessions', () => {
    const p = pairs()
    p.redeem(p.offer())
    p.redeem(p.offer())
    p.offer()
    expect(p.forget()).toBe(2)
    expect(p.holds('secret-2')).toBe(false)
    expect(JSON.parse(readFileSync(file(), 'utf8'))).toEqual({ tokens: [], sessions: [] })
  })

  test('a workspace that never paired holds nothing', () => {
    expect(pairs().holds('secret-1')).toBe(false)
  })
})
