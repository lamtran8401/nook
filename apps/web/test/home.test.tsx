import { describe, expect, test } from 'bun:test'

import type { HomeView } from '@nook/core/read.ts'

import { HomeBrief } from '@/components/HomeBrief.tsx'
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
    const heads = [...markup.matchAll(/<(?:a|div) class="nk-group__head"(?: href="([^"]+)")?/g)].map(m => m[1] ?? 'desk')
    expect(heads).toEqual(['/works/SHOP-12', 'desk', '/works/SHOP-13', '/works/SHOP-14', '/works/SHOP-11'])
    expect(text(markup)).toContain('SHOP-12 Pay with a saved card cooking ! Q2 blocks: Must a refund go to the same card? nook eng answer SHOP-12 Q2 "<answer>" Answer ! T4 failed: the clock fake skips a try nook eng task retry SHOP-12 T4')
  })

  test('a line of no item, such as a gap of the doctor, sits under This desk', () => {
    expect(text(html(<HomeBrief view={view({ brief: BRIEF })} />))).toContain('This desk ! engineering: backlog/ is missing nook init --update')
  })

  test('a gate runs from its button, and an answer links to the questions of the item', () => {
    const markup = html(<HomeBrief view={view({ brief: BRIEF })} />)
    expect(markup).toContain('<input type="hidden" name="kind" value="gate"/><input type="hidden" name="item" value="SHOP-13"/><input type="hidden" name="move" value="accept"/>')
    expect(markup).toContain('<a class="bn-btn" data-variant="primary" data-size="sm" href="/works/SHOP-12">Answer</a>')
  })

  test('what runs and what is done is one line for each item, with the command of the lead', () => {
    expect(text(html(<HomeBrief view={view({ brief: BRIEF })} />))).toEndWith('Runs SHOP-14 Export the list cooking /cook SHOP-14 Done since yesterday SHOP-11 Show the total done')
  })

  test('says that nothing waits when no line waits', () => {
    expect(text(html(<HomeBrief view={view({ brief: [BRIEF[2]!] })} />))).toBe('0 Urgent 0 Wait for you 0 The lead runs 1 Done since yesterday Nothing waits for you. Done since yesterday SHOP-11 Show the total done')
  })
})
