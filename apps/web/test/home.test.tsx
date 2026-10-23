import { describe, expect, test } from 'bun:test'

import type { BriefLine } from '@nook/workspace/workspaces.ts'
import type { BoardCard } from '@nook/engineering/read/reader.ts'
import type { Metrics } from '@nook/engineering/report/metrics.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'

import { Inbox } from '@/components/inbox.tsx'
import { html, text } from '@/test/markup.ts'

process.env.TZ = 'UTC'

const SHOP_12 = { id: 'SHOP-12', title: 'Pay with a saved card', state: 'cooking' }
const SHOP_13 = { id: 'SHOP-13', title: 'Export the order list', state: 'planning' }
const BRIEF: BriefLine[] = [
  { part: 'runs', text: 'SHOP-14 cooking: Export the list', action: '/cook SHOP-14', item: { id: 'SHOP-14', title: 'Export the list', state: 'cooking' } },
  { part: 'waits', text: 'SHOP-13 waits for your approve: Export the order list', action: '/gate approve SHOP-13', urgent: true, item: SHOP_13 },
  { part: 'done', text: 'SHOP-11 accepted: Show the total', item: { id: 'SHOP-11', title: 'Show the total', state: 'done' } },
  { part: 'waits', text: 'SHOP-12 Q2 blocks: Must a refund go to the same card?', action: 'nook eng answer SHOP-12 Q2 "<answer>"', urgent: true, item: SHOP_12 },
  { part: 'waits', text: 'engineering: backlog/ is missing', action: 'nook init --update' },
]
const Q2: Question = { id: 'Q2', item: 'SHOP-12', text: 'Must a refund go to the same card?', blocking: true, recommended: 'the same card', answer: null, status: 'open', asked_by: 'lead', answered_by: null, asked_at: '2026-10-16T11:12:00Z', answered_at: null }
const H = 3_600_000
const METRICS: Metrics = {
  since: '2026-09-20T00:00:00.000Z', until: '2026-10-20T00:00:00.000Z',
  rework: { part: 1, whole: 4, rejects: 2 }, firstPass: { part: 2, whole: 3 }, sliceRework: { part: 1, whole: 10 },
  cycle: { median: 25 * H, longest: { ms: 48 * H, item: 'SHOP-1' }, count: 3 },
  approveWait: { median: 2 * H, longest: { ms: 3 * H, item: 'SHOP-1' }, count: 2 },
  acceptWait: { median: 6 * H, longest: { ms: 18 * H, item: 'SHOP-1' }, count: 3 },
  rootCauses: [],
}
const EMPTY: Metrics = { ...METRICS, rework: { part: 0, whole: 0, rejects: 0 }, firstPass: { part: 0, whole: 0 }, cycle: { median: null, longest: null, count: 0 }, approveWait: { median: null, longest: null, count: 0 } }
const card = (id: string, state: BoardCard['state']) => ({ id, state }) as BoardCard

const inbox = (fields: Partial<Parameters<typeof Inbox>[0]> = {}) =>
  html(<Inbox brief={BRIEF} questions={[Q2]} metrics={METRICS} trend={[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, METRICS]} receipts={[]} cards={[]} base="/personal" {...fields} />)
const rows = (markup: string) => [...markup.matchAll(/<li data-slot="inbox-row"[\s\S]*?<\/li>(?=<li data-slot="inbox-row"|<\/ol>)/g)].map(m => m[0])
const tile = (markup: string, title: string) => [...markup.matchAll(/<section data-slot="(?:tile|trend-tile)"[\s\S]*?<\/section>/g)].map(m => text(m[0])).find(words => words.startsWith(title))!

describe('Inbox', () => {
  test('a gate row names the item and its move, with Review and the move with its key', () => {
    const [gate] = rows(inbox())
    expect(text(gate!)).toBe('SHOP-13 Export the order list Waits for your approve Review Approve A')
    expect(gate).toContain('<input type="hidden" name="kind" value="gate"/><input type="hidden" name="item" value="SHOP-13"/><input type="hidden" name="move" value="approve"/>')
    expect(gate).toContain('data-key="a"')
  })

  test('a blocking question takes its answer in its row, with the answer that the lead recommends', () => {
    const question = rows(inbox())[1]!
    expect(text(question)).toBe('SHOP-12 Pay with a saved card Q2 blocks: Must a refund go to the same card? Answer')
    expect(question).toContain('placeholder="Recommended: the same card"')
    expect(question).toContain('<input type="hidden" name="kind" value="answer"/>')
  })

  test('a move with no item, such as a gap of the doctor, gives its command', () => {
    expect(text(rows(inbox())[2]!)).toBe('Engineering: backlog/ is missing nook init --update')
  })

  test('at rest no row has the highlight', () => {
    expect(rows(inbox()).map(row => /data-selected="(\w+)"/.exec(row)![1])).toEqual(['false', 'false', 'false'])
  })

  test('says so when nothing waits', () => {
    expect(tile(inbox({ brief: [] }), 'Waits for you')).toBe('Waits for you 0 Nothing waits for you.')
  })

  test('each number of the flow has its value, its trend of six weeks and its line', () => {
    const markup = inbox()
    expect(tile(markup, 'Rework rate')).toBe('Rework rate 25 % 1 of 4 sent back')
    expect(tile(markup, 'Cycle time')).toBe('Cycle time 1 d 1 h median, longest 2 d (SHOP-1)')
    expect(markup.match(/data-slot="sparkline"/g)).toHaveLength(4)
  })

  test('a number with no data says so, never 0%', () => {
    expect(tile(inbox({ metrics: EMPTY }), 'First pass')).toBe('First pass No data 0 of 0 accepted')
  })

  test('the board counts the items of each step, and what runs and what is done name their items', () => {
    const markup = inbox({ cards: [card('SHOP-1', 'cooking'), card('SHOP-2', 'cooking'), card('SHOP-3', 'review')] })
    expect(tile(markup, 'Board')).toBe('Board 3 items cooking 2 review 1')
    expect(tile(markup, 'The lead runs')).toBe('The lead runs 1 SHOP-14 Export the list /cook SHOP-14')
    expect(tile(markup, 'Done since yesterday')).toBe('Done since yesterday 1 SHOP-11 Show the total')
  })

  test('a workspace with no engineering shows no numbers and no board', () => {
    const markup = inbox({ metrics: null, trend: null })
    expect(markup).not.toContain('data-slot="trend-tile"')
  })
})
