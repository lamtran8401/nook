import { describe, expect, test } from 'bun:test'

import type { BoardCard } from '@nook/engineering/read/reader.ts'
import { refused } from '@nook/shared/errors.ts'

import { Board } from '@/components/Board.tsx'
import { Criteria } from '@/components/Criteria.tsx'
import { Diagram } from '@/components/Diagram.tsx'
import { Gap } from '@/components/Gap.tsx'
import { ItemCard } from '@/components/ItemCard.tsx'
import { TabLinks } from '@/components/TabLinks.tsx'
import { html, text } from '@/test/markup.ts'

const card = (fields: Partial<BoardCard> = {}): BoardCard => ({
  id: 'SHOP-12', title: 'Filter shipments by status', kind: 'feature', size: 'M', state: 'cooking', areas: ['api', 'web'], criteria: { met: 1, total: 3 },
  slices: { done: 2, total: 5 }, next: { owner: false, skill: '/cook SHOP-12' }, flags: [], ...fields,
})

describe('ItemCard', () => {
  test('shows the title, the areas, the id, the criteria met, the size and whose turn it is, and links to the item', () => {
    const markup = html(<ItemCard card={card()} />)
    expect(markup).toContain('href="/works/SHOP-12"')
    expect(markup).toContain('<span class="nk-kind" data-tone="success" title="feature"')
    expect(markup).toContain('<span class="nk-turn" data-tone="violet" title="The lead runs /cook SHOP-12">AI</span>')
    expect(text(markup)).toBe('Filter shipments by status api web SHOP-12 1/3 M AI')
  })

  test('draws the criteria met as a bar, and none for an item with no criteria yet', () => {
    expect(html(<ItemCard card={card()} />)).toContain('<span class="nk-bar" title="1 of 3 criteria met"><i style="width:33%"></i></span>')
    const none = html(<ItemCard card={card({ criteria: { met: 0, total: 0 } })} />)
    expect(none).not.toContain('nk-bar')
    expect(text(none)).not.toContain('0/0')
  })

  test('a move of the owner is YOU, and each blocking question and failed slice is a flag', () => {
    const markup = html(<ItemCard card={card({ next: { owner: true, skill: 'answer Q2: nook eng answer SHOP-12 Q2 "<answer>"' }, flags: ['Q2 blocks', 'T4 failed'] })} />)
    expect(markup).toContain('title="Your move: answer Q2">YOU</span>')
    expect(markup).toContain('<span class="nk-flag">Q2 blocks</span><span class="nk-flag">T4 failed</span>')
  })
})

describe('Board', () => {
  test('gives one column for each state that holds items, in the order of the flow', () => {
    const markup = html(<Board cards={[card({ id: 'SHOP-3', state: 'done' }), card({ id: 'SHOP-1', state: 'backlog' }), card({ id: 'SHOP-2', state: 'cooking' })]} />)
    expect([...markup.matchAll(/data-state="(\w+)"/g)].map(m => m[1])).toEqual(['backlog', 'cooking', 'done'])
    expect(text(markup)).toContain('cooking 1')
    expect(markup).toContain('<section class="nk-col" data-state="cooking" data-tone="primary">')
  })

  test('says so when the desk has no item', () => {
    expect(text(html(<Board cards={[]} />))).toBe('No item yet Type /intake in the agent session to start one.')
  })
})

describe('Criteria', () => {
  test('lists each criterion with its number, its text and whether it is met', () => {
    const markup = html(
      <Criteria criteria={[
        { item: 'SHOP-12', n: 1, text: 'The filter lists the 5 statuses.', done: true, evidence: 'api test passes', grade: 'run', by: 'verifier', at: 'now' },
        { item: 'SHOP-12', n: 2, text: 'An empty filter shows every shipment.', done: false, evidence: null, grade: null, by: null, at: null },
      ]} />,
    )
    expect(text(markup)).toBe('AC1 The filter lists the 5 statuses. api test passes met AC2 An empty filter shows every shipment. open')
  })

  test('draws the tag that the ledger keeps before a criterion as a badge', () => {
    const markup = html(<Criteria criteria={[{ item: 'SHOP-12', n: 1, text: '[ADD] the export has the right date', done: false, evidence: null, grade: null, by: null, at: null }]} />)
    expect(markup).toContain('<span class="bn-badge" data-tone="success">ADD</span>')
    expect(text(markup)).toBe('AC1 ADD the export has the right date open')
  })
})

describe('Diagram', () => {
  test('holds its spec for the Bench library, safe inside the page', () => {
    const markup = html(<Diagram spec={{ type: 'filetree', items: [{ name: '</script><b>x' }] }} />)
    expect(markup).toBe('<div class="nk-diagram" data-nook-diagram="{&quot;type&quot;:&quot;filetree&quot;,&quot;items&quot;:[{&quot;name&quot;:&quot;&lt;/script&gt;&lt;b&gt;x&quot;}]}"></div>')
  })
})

describe('TabLinks', () => {
  test('links each tab and marks the one of the current page', () => {
    const markup = html(<TabLinks tabs={[{ href: '/', label: 'Home' }, { href: '/works', label: 'Works' }]} current="/works/SHOP-12" />)
    expect(markup).toBe('<nav class="nk-tabs" aria-label="Packs"><a href="/">Home</a><a href="/works" aria-current="page">Works</a></nav>')
  })
})

describe('Gap', () => {
  test('shows a gap of the desk and its fix in place of the data', () => {
    const markup = html(<Gap error={refused('the ledger needs 1 migration', 'run any `nook eng` command in the desk')} />)
    expect(markup).toContain('class="bn-alert" data-tone="warning"')
    expect(text(markup)).toBe('! The ledger needs 1 migration Fix: run any `nook eng` command in the desk')
  })
})
