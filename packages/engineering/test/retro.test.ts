import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { retroFacts } from '../src/report/retro.ts'
import { itemAt, LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const event = (type: string, reason: string, at: string, to: string | null = null) =>
  t.kit(LEAD).ledger.run(
    "INSERT INTO event (item, type, from_state, to_state, actor, role, reason, at) VALUES ('SHOP-1', ?, NULL, ?, 'lead', 'lead', ?, ?)",
    type,
    to,
    reason,
    at,
  )

describe('retroFacts', () => {
  test('each item sent back, reopened, reframed or replanned, each flipped guess, failed slice and weak proof, since the time', () => {
    itemAt(t, 'planning')
    event('reject', 'AC 4 has no test', '2026-10-16T09:00:00.000Z', 'cooking')
    event('reopen', 'a gap of the page', '2026-10-16T10:00:00.000Z', 'cooking')
    event('guess', 'G2 flipped; back to todo: T3; answer: 2 rows', '2026-10-16T11:00:00.000Z')
    event('guess', 'G1 accepted', '2026-10-16T11:01:00.000Z')
    event('task', 'T2 fail: the api does not start', '2026-10-16T12:00:00.000Z', 'failed')
    event('prove', 'T1 none: the tests did not run on the base', '2026-10-16T12:30:00.000Z')
    event('prove', 'T3 proven: the tests fail on the base', '2026-10-16T12:31:00.000Z')
    event('reject', 'an old reject', '2026-10-01T09:00:00.000Z', 'cooking')
    expect(retroFacts(t.kit(LEAD), new Date('2026-10-15T00:00:00.000Z'))).toEqual([
      { item: 'SHOP-1', kind: 'sent back', text: 'AC 4 has no test', at: '2026-10-16T09:00:00.000Z' },
      { item: 'SHOP-1', kind: 'reopened', text: 'a gap of the page', at: '2026-10-16T10:00:00.000Z' },
      { item: 'SHOP-1', kind: 'guess flipped', text: 'G2 flipped; back to todo: T3; answer: 2 rows', at: '2026-10-16T11:00:00.000Z' },
      { item: 'SHOP-1', kind: 'slice failed', text: 'T2 fail: the api does not start', at: '2026-10-16T12:00:00.000Z' },
      { item: 'SHOP-1', kind: 'weak proof', text: 'T1 none: the tests did not run on the base', at: '2026-10-16T12:30:00.000Z' },
    ])
  })

  test('a blocking question is slow when it waited 30 min or more for the owner, or still waits', () => {
    itemAt(t, 'planning')
    event('question', 'Q1 asked (blocking): which zone?', '2026-10-16T09:00:00.000Z')
    event('question', 'Q1 answered: UTC', '2026-10-16T11:30:00.000Z')
    event('question', 'Q2 asked (blocking): which size?', '2026-10-16T12:00:00.000Z')
    event('question', 'Q3 asked: a small one?', '2026-10-16T12:05:00.000Z')
    event('question', 'Q4 asked (blocking): a quick one?', '2026-10-16T13:00:00.000Z')
    event('question', 'Q4 answered: yes', '2026-10-16T13:03:00.000Z')
    expect(retroFacts(t.kit(LEAD), new Date('2026-10-15T00:00:00.000Z'))).toEqual([
      { item: 'SHOP-1', kind: 'slow question', text: 'Q1 waited 2 h 30 min for you: which zone?', at: '2026-10-16T09:00:00.000Z' },
      { item: 'SHOP-1', kind: 'slow question', text: 'Q2 still waits for you: which size?', at: '2026-10-16T12:00:00.000Z' },
    ])
  })

  test('only the last proof of a slice counts: a weak one that a later proof made good is no fact', () => {
    itemAt(t, 'planning')
    event('prove', 'T1 none: the tests did not run on the base', '2026-10-16T09:00:00.000Z')
    event('prove', 'T1 proven: the tests fail on the base', '2026-10-16T09:10:00.000Z')
    event('prove', 'T2 weak: the tests pass on the base', '2026-10-16T09:20:00.000Z')
    event('prove', 'T2 weak: the tests pass on the base', '2026-10-16T09:30:00.000Z')
    expect(retroFacts(t.kit(LEAD), new Date('2026-10-15T00:00:00.000Z'))).toEqual([
      { item: 'SHOP-1', kind: 'weak proof', text: 'T2 weak: the tests pass on the base', at: '2026-10-16T09:30:00.000Z' },
    ])
  })

  test('a long reason is cut to one line', () => {
    itemAt(t, 'planning')
    event('reject', `blocking: ${'x'.repeat(300)}`, '2026-10-16T09:00:00.000Z', 'cooking')
    const [fact] = retroFacts(t.kit(LEAD), new Date('2026-10-15T00:00:00.000Z'))
    expect([fact!.text.length, fact!.text.endsWith('…')]).toEqual([160, true])
  })
})
