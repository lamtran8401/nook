import { describe, expect, test } from 'bun:test'

import { metricsOf, metricsText, rootCauseFacts } from '../src/report/metrics.ts'
import type { Event } from '../src/stores/events.ts'

let id = 0
/** One event of the ledger, written by hand. */
const ev = (item: string, type: string, at: string, from: string | null = null, to: string | null = null): Event => ({ id: ++id, item, type, from_state: from, to_state: to, actor: 'lead', role: 'lead', reason: null, at: `2026-${at}:00.000Z` })
const done = (item: string, at: string) => ev(item, 'task', at, 'running', 'done')

const HISTORIES = [
  // before the span: never counts
  { item: 'SHOP-0', rootCause: 'Configuration error', events: [ev('SHOP-0', 'new', '09-01T09:00'), ev('SHOP-0', 'submit', '09-02T09:00'), ev('SHOP-0', 'reject', '09-02T10:00'), ev('SHOP-0', 'accept', '09-03T09:00')] },
  {
    item: 'SHOP-1',
    rootCause: 'Integration error',
    events: [
      ev('SHOP-1', 'new', '10-01T09:00'), ev('SHOP-1', 'agree', '10-01T10:00'), ev('SHOP-1', 'import', '10-01T12:00'), ev('SHOP-1', 'approve', '10-01T15:00'),
      ...['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'].map(() => done('SHOP-1', '10-02T08:00')),
      ev('SHOP-1', 'task', '10-02T08:30', 'done', 'running'),
      ev('SHOP-1', 'submit', '10-02T09:00'), ev('SHOP-1', 'reject', '10-02T10:00'), ev('SHOP-1', 'submit', '10-02T12:00'), ev('SHOP-1', 'reject', '10-02T13:00'),
      ev('SHOP-1', 'submit', '10-02T15:00'), ev('SHOP-1', 'accept', '10-03T09:00'),
    ],
  },
  { item: 'SHOP-2', rootCause: 'Requirement problem', events: [ev('SHOP-2', 'new', '10-04T09:00'), ev('SHOP-2', 'agree', '10-04T10:00'), ev('SHOP-2', 'approve', '10-04T11:00'), ev('SHOP-2', 'submit', '10-05T09:00'), ev('SHOP-2', 'accept', '10-05T10:00')] },
  { item: 'SHOP-3', rootCause: 'Integration error', events: [ev('SHOP-3', 'new', '10-06T09:00'), ev('SHOP-3', 'proceed', '10-06T10:00'), ev('SHOP-3', 'submit', '10-06T12:00'), ev('SHOP-3', 'accept', '10-06T18:00')] },
  { item: 'SHOP-4', events: [ev('SHOP-4', 'new', '10-07T09:00'), ev('SHOP-4', 'submit', '10-07T12:00')] },
]
const SINCE = new Date('2026-10-01T00:00:00Z')
const UNTIL = new Date('2026-10-08T00:00:00Z')
const H = 3_600_000

describe('metricsOf', () => {
  const m = metricsOf(HISTORIES, SINCE, UNTIL)

  test('the rework rate: the reviewed items sent back, and the count of rejects', () => {
    expect(m.rework).toEqual({ part: 1, whole: 4, rejects: 2 })
  })

  test('the first pass: the accepted items with no send-back', () => {
    expect(m.firstPass).toEqual({ part: 2, whole: 3 })
  })

  test('the slice rework: the done slices reopened, out of the slices done', () => {
    expect(m.sliceRework).toEqual({ part: 1, whole: 10 })
  })

  test('the cycle time runs from the first event to the accept', () => {
    expect(m.cycle).toEqual({ median: 25 * H, longest: { ms: 48 * H, item: 'SHOP-1' }, count: 3 })
  })

  test('the approve wait runs from the import of the slices, or the agree; a proceed of a yolo run is no wait', () => {
    expect(m.approveWait).toEqual({ median: 2 * H, longest: { ms: 3 * H, item: 'SHOP-1' }, count: 2 })
  })

  test('the accept wait runs from the last submit', () => {
    expect(m.acceptWait).toEqual({ median: 6 * H, longest: { ms: 18 * H, item: 'SHOP-1' }, count: 3 })
  })

  test('the root causes of the items accepted in the span, each with its count and its items, the most frequent first', () => {
    expect(m.rootCauses).toEqual([
      { type: 'Integration error', count: 2, items: ['SHOP-1', 'SHOP-3'], at: '2026-10-06T18:00:00.000Z' },
      { type: 'Requirement problem', count: 1, items: ['SHOP-2'], at: '2026-10-05T10:00:00.000Z' },
    ])
  })

  test('the root causes become facts of the retro, one for each type', () => {
    expect(rootCauseFacts(m)).toEqual([
      { kind: 'root causes', item: 'Integration error', text: '2 accepted: SHOP-1, SHOP-3', at: '2026-10-06T18:00:00.000Z' },
      { kind: 'root causes', item: 'Requirement problem', text: '1 accepted: SHOP-2', at: '2026-10-05T10:00:00.000Z' },
    ])
  })
})

describe('metricsText', () => {
  test('gives one line for each metric, its value first', () => {
    expect(metricsText(metricsOf(HISTORIES, SINCE, UNTIL))).toBe(
      [
        'span 2026-10-01 to 2026-10-08',
        'rework rate   25%  1 of 4 reviewed items sent back, 2 rejects',
        'first pass    67%  2 of 3 accepted items with no send-back',
        'slice rework  10%  1 of 10 done slices reopened',
        'cycle time    median 1 d 1 h · longest 2 d (SHOP-1) · 3 items',
        'approve wait  median 2 h · longest 3 h (SHOP-1) · 2 approves',
        'accept wait   median 6 h · longest 18 h (SHOP-1) · 3 accepts',
        'root causes   Integration error 2 · Requirement problem 1',
      ].join('\n'),
    )
  })

  test('a metric with no event in the span says no data, never 0%', () => {
    expect(metricsText(metricsOf([], SINCE, UNTIL))).toBe(
      ['span 2026-10-01 to 2026-10-08', 'rework rate   no data', 'first pass    no data', 'slice rework  no data', 'cycle time    no data', 'approve wait  no data', 'accept wait   no data', 'root causes   no data'].join('\n'),
    )
  })
})
