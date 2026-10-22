import { describe, expect, test } from 'bun:test'

import type { BriefLine } from '@nook/desk/desks.ts'

import { greeting, inboxRows, summary, whoOf } from '@/lib/inbox.ts'

const item = (id: string, title: string, state = 'planning') => ({ id, title, state })
const BRIEF: BriefLine[] = [
  { part: 'waits', text: 'SHOP-41 is done and waits for its close: Show the order total', action: '/close SHOP-41', item: item('SHOP-41', 'Show the order total with tax', 'done') },
  { part: 'waits', text: 'SHOP-43 waits for your approve: Export the order list as CSV', action: '/gate approve SHOP-43', urgent: true, item: item('SHOP-43', 'Export the order list as CSV') },
  { part: 'waits', text: 'SHOP-42 Q2 blocks: Must a refund go to the same card?', action: 'nook eng answer SHOP-42 Q2 "<answer>"', urgent: true, item: item('SHOP-42', 'Pay with a saved card', 'cooking') },
  { part: 'runs', text: 'SHOP-45 framing', action: '/spec SHOP-45', item: item('SHOP-45', 'Search orders', 'framing') },
  { part: 'done', text: 'SHOP-40 accepted: Filter shipments', item: item('SHOP-40', 'Filter shipments', 'done') },
]

describe('the rows of the inbox', () => {
  test('give each move that waits for the owner, the urgent ones first, with its move and the words under the title', () => {
    expect(inboxRows(BRIEF).map(r => [r.item?.id, r.tone, r.sub, r.gate ?? r.question ?? r.command])).toEqual([
      ['SHOP-43', 'danger', 'Waits for your approve', 'approve'],
      ['SHOP-42', 'danger', 'Q2 blocks: Must a refund go to the same card?', 'Q2'],
      ['SHOP-41', 'warning', 'Is done and waits for its close', '/close SHOP-41'],
    ])
  })
})

describe('the summary of the inbox', () => {
  test('counts what waits, what the lead runs and what is done since yesterday', () => {
    expect(summary(BRIEF)).toBe('3 moves wait for you · the lead runs 1 item · 1 done since yesterday')
    expect(summary([])).toBe('Nothing waits for you · the lead runs nothing · nothing done since yesterday')
  })
})

describe('the greeting', () => {
  test('follows the time of day', () => {
    expect([9, 14, 20].map(hour => greeting(new Date(2026, 9, 22, hour)))).toEqual(['Good morning', 'Good afternoon', 'Good evening'])
  })
})

describe('who did an event', () => {
  test('is you, the lead, or an agent by the initials of its name', () => {
    expect(['You approved the plan', 'The lead began the build', 'backend-builder-a1 moved a slice'].map(whoOf)).toEqual([
      { mark: 'YOU', who: 'You' },
      { mark: 'LD', who: 'The lead' },
      { mark: 'BB', who: 'backend-builder-a1' },
    ])
  })
})
