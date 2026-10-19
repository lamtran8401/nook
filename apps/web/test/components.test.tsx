import { describe, expect, test } from 'bun:test'

import type { BoardCard } from '@nook/engineering/read/reader.ts'
import { refused } from '@nook/shared/errors.ts'

import { Board } from '@/components/Board.tsx'
import { Criteria } from '@/components/Criteria.tsx'
import { Diagram } from '@/components/Diagram.tsx'
import { Gap } from '@/components/Gap.tsx'
import { TabLinks } from '@/components/TabLinks.tsx'
import { html, text } from '@/test/markup.ts'

const card = (fields: Partial<BoardCard> = {}): BoardCard => ({
  id: 'SHOP-12', title: 'Filter shipments by status', kind: 'feature', size: 'M', state: 'cooking', areas: ['api', 'web'], criteria: { met: 1, total: 3 },
  slices: { done: 2, total: 5 }, next: { owner: false, skill: '/cook SHOP-12' }, flags: [], ...fields,
})

const specOf = (markup: string) => JSON.parse(/data-nook-diagram="([^"]*)"/.exec(markup)![1]!.replaceAll('&quot;', '"').replaceAll('&amp;', '&'))

describe('Board', () => {
  test('draws the Bench board: one column for each state that holds items, in the order of the flow, the empty ones in the panel', () => {
    const spec = specOf(html(<Board cards={[card({ id: 'SHOP-3', state: 'done' }), card({ id: 'SHOP-1', state: 'backlog' }), card({ id: 'SHOP-2', state: 'cooking' })]} areas={['api', 'web']} />))
    expect(spec).toMatchObject({ type: 'board', frame: false })
    expect(spec.columns.map((c: { title: string; tone: string }) => [c.title, c.tone])).toEqual([['backlog', 'neutral'], ['cooking', 'primary'], ['done', 'success']])
    expect(spec.rest.map((r: { title: string }) => r.title)).toEqual(['framing', 'planning', 'ready', 'review'])
  })

  test('a card links to its item and shows the kind, the size, the areas in their tones, the criteria met and whose move is next', () => {
    const spec = specOf(html(<Board cards={[card()]} areas={['api', 'web']} />))
    expect(spec.columns[0].cards[0]).toEqual({
      id: 'SHOP-12', title: 'Filter shipments by status', href: '/works/SHOP-12',
      kind: 'feature', kindTone: 'success', kindIcon: 'sparkle', size: 'M',
      areas: [{ name: 'api', tone: 'primary' }, { name: 'web', tone: 'violet' }],
      meter: { value: 1, max: 3, text: '1/3 criteria', tone: 'success' },
      note: 'The lead runs /cook', noteIcon: 'bot',
    })
  })

  test('a failed slice rings the card red and a blocking question amber, each named in the foot; a move of the owner names it', () => {
    const spec = specOf(html(<Board cards={[card({ flags: ['Q2 blocks', 'T4 failed'], next: { owner: true, skill: 'owner: /gate approve SHOP-12' } }), card({ id: 'SHOP-13', flags: ['Q1 blocks'] })]} areas={[]} />))
    const [failed, waiting] = spec.columns[0].cards
    expect(failed).toMatchObject({ flag: 'fail', note: 'Your move: approve', noteIcon: 'user', foot: [{ icon: 'clock', text: 'Q2 blocks', kind: 'wait' }, { icon: 'alert', text: 'T4 failed', kind: 'fail' }] })
    expect(waiting).toMatchObject({ flag: 'wait', foot: [{ icon: 'clock', text: 'Q1 blocks', kind: 'wait' }] })
  })

  test('a card with no criteria yet has no meter', () => {
    expect(specOf(html(<Board cards={[card({ criteria: { met: 0, total: 0 } })]} areas={[]} />)).columns[0].cards[0].meter).toBeUndefined()
  })

  test('says so when the desk has no item', () => {
    expect(text(html(<Board cards={[]} areas={[]} />))).toBe('No item yet Type /intake in the agent session to start one.')
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
