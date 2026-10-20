import { describe, expect, test } from 'bun:test'

import type { HomeView } from '@nook/core/read.ts'

import type { Metrics } from '@nook/engineering/report/metrics.ts'

import { FlowMetrics } from '@/components/flow-metrics.tsx'
import { HomeBrief } from '@/components/home-brief.tsx'
import { html, text } from '@/test/markup.ts'

const view = (fields: Partial<HomeView>): HomeView => ({ dir: '/desk', brief: [], findings: [], ...fields })
const SHOP_12 = { id: 'SHOP-12', title: 'Pay with a saved card', state: 'cooking' }
const SHOP_13 = { id: 'SHOP-13', title: 'Send a mail when an order ships', state: 'review' }
const BRIEF: HomeView['brief'] = [
  { part: 'runs', text: 'SHOP-14 cooking: Export the list', action: '/cook SHOP-14', item: { id: 'SHOP-14', title: 'Export the list', state: 'cooking' } },
  { part: 'waits', text: 'SHOP-13 waits for your accept: Send a mail when an order ships', action: '/gate accept SHOP-13', item: SHOP_13 },
  { part: 'done', text: 'SHOP-11 accepted: Show the total', item: { id: 'SHOP-11', title: 'Show the total', state: 'done' } },
  { part: 'waits', text: 'SHOP-12 Q2 blocks: Must a refund go to the same card?', action: 'nook eng answer SHOP-12 Q2 "<answer>"', urgent: true, item: SHOP_12 },
  { part: 'waits', text: 'SHOP-12 T4 failed: the clock fake skips a try', action: 'nook eng task retry SHOP-12 T4', item: SHOP_12 },
  { part: 'waits', text: 'engineering: backlog/ is missing', action: 'nook init --update', urgent: true },
]

describe('HomeBrief', () => {
  test('counts the urgent waits, all waits, what the lead runs and what is done, on top', () => {
    expect(text(html(<HomeBrief view={view({ brief: BRIEF })} />))).toStartWith('2 Urgent 4 Wait for you 1 The lead runs 1 Done since yesterday')
  })

  test('groups what waits by item, the item of an urgent line first, each group linked to its item', () => {
    const markup = html(<HomeBrief view={view({ brief: BRIEF })} />)
    const heads = ['href="/works/SHOP-12"', '>This desk<', 'href="/works/SHOP-13"', 'href="/works/SHOP-14"', 'href="/works/SHOP-11"'].map(head => markup.indexOf(head))
    expect(heads.every(at => at >= 0)).toBe(true)
    expect([...heads].sort((a, b) => a - b)).toEqual(heads)
    expect(text(markup)).toContain('SHOP-12 Pay with a saved card cooking ! Q2 blocks: Must a refund go to the same card? nook eng answer SHOP-12 Q2 "<answer>" Answer ! T4 failed: the clock fake skips a try nook eng task retry SHOP-12 T4')
  })

  test('a line of no item, such as a gap of the doctor, sits under This desk', () => {
    expect(text(html(<HomeBrief view={view({ brief: BRIEF })} />))).toContain('This desk ! engineering: backlog/ is missing nook init --update')
  })

  test('a gate runs from its button, and an answer links to the questions of the item', () => {
    const markup = html(<HomeBrief view={view({ brief: BRIEF })} />)
    expect(markup).toContain('<input type="hidden" name="kind" value="gate"/><input type="hidden" name="item" value="SHOP-13"/><input type="hidden" name="move" value="accept"/>')
    const answer = /<a [^>]*>Answer<\/a>/.exec(markup)![0]
    expect(answer).toContain('href="/works/SHOP-12"')
    expect(answer).toContain('data-slot="button"')
  })

  test('what runs and what is done is one line for each item, with the command of the lead', () => {
    expect(text(html(<HomeBrief view={view({ brief: BRIEF })} />))).toEndWith('Runs SHOP-14 Export the list cooking /cook SHOP-14 Done since yesterday SHOP-11 Show the total done')
  })

  test('says that nothing waits when no line waits', () => {
    expect(text(html(<HomeBrief view={view({ brief: [BRIEF[2]!] })} />))).toBe('0 Urgent 0 Wait for you 0 The lead runs 1 Done since yesterday Nothing waits for you. Done since yesterday SHOP-11 Show the total done')
  })
})

describe('FlowMetrics', () => {
  const H = 3_600_000
  const metrics: Metrics = {
    since: '2026-09-20T00:00:00.000Z', until: '2026-10-20T00:00:00.000Z',
    rework: { part: 1, whole: 4, rejects: 2 }, firstPass: { part: 2, whole: 3 }, sliceRework: { part: 1, whole: 10 },
    cycle: { median: 25 * H, longest: { ms: 48 * H, item: 'SHOP-1' }, count: 3 },
    approveWait: { median: 2 * H, longest: { ms: 3 * H, item: 'SHOP-1' }, count: 2 },
    acceptWait: { median: 6 * H, longest: { ms: 18 * H, item: 'SHOP-1' }, count: 3 },
    rootCauses: [],
  }

  test('shows the rework rate, the first pass and the median cycle time of the last 30 days', () => {
    expect(text(html(<FlowMetrics metrics={metrics} />))).toBe('Last 30 days Rework rate 25% 1 of 4 sent back First pass 67% 2 of 3 accepted Cycle time 25 h median of 3')
  })

  test('a metric with no data says so, never 0%', () => {
    const empty: Metrics = { ...metrics, rework: { part: 0, whole: 0, rejects: 0 }, firstPass: { part: 0, whole: 0 }, cycle: { median: null, longest: null, count: 0 } }
    expect(text(html(<FlowMetrics metrics={empty} />))).toBe('Last 30 days Rework rate No data First pass No data Cycle time No data')
  })

  test('a desk with no engineering shows no metrics', () => {
    expect(html(<FlowMetrics metrics={null} />)).toBe('')
  })
})
