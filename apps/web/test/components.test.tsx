import { describe, expect, test } from 'bun:test'

import type { BoardCard } from '@nook/engineering/read/reader.ts'
import { refused } from '@nook/shared/errors.ts'

import { Board } from '@/components/board.tsx'
import type { BoardOptions } from '@/lib/board.ts'
import { Criteria } from '@/components/criteria.tsx'
import { Diagram } from '@/components/diagram.tsx'
import { Gap } from '@/components/gap.tsx'
import { isCurrentPage } from '@/components/desk-nav.tsx'
import { html, text } from '@/test/markup.ts'

const card = (fields: Partial<BoardCard> = {}): BoardCard => ({
  id: 'SHOP-12', title: 'Filter shipments by status', kind: 'feature', size: 'M', points: null, mode: 'normal', state: 'cooking', blocked_from: null, areas: ['api', 'web'], criteria: { met: 1, total: 3 },
  slices: { done: 2, total: 5 }, next: { owner: false, skill: '/cook SHOP-12' }, flags: [], ...fields,
})

const specOf = (markup: string) => JSON.parse(/data-diagram="([^"]*)"/.exec(markup)![1]!.replaceAll('&quot;', '"').replaceAll('&amp;', '&'))

const BOARD: BoardOptions = { layout: 'board', group: 'phase', kind: 'all' }
const frames = (markup: string) => [...markup.matchAll(/<section data-slot="frame"[\s\S]*?<\/section>/g)].map(found => text(found[0]))

describe('Board', () => {
  test('shows a frame for each phase in the order of the flow, then the backlog; a blocked item counts in the step it was blocked from', () => {
    const markup = html(<Board cards={[card({ id: 'SHOP-3', state: 'done' }), card({ id: 'SHOP-1', state: 'backlog' }), card({ id: 'SHOP-4', state: 'blocked', blocked_from: 'review' })]} options={BOARD} base="/personal" />)
    expect(frames(markup).map(words => words.split(' ').slice(0, 2).join(' '))).toEqual(['Shape 0', 'Build 0', 'Review 1', 'Done 1', 'Backlog 1'])
  })

  test('a card shows its points, and its frame and the lane count them', () => {
    const markup = html(<Board cards={[card({ points: 8 }), card({ id: 'SHOP-13', points: 3 })]} options={BOARD} base="/personal" />)
    expect(text(markup)).toContain('SHOP-12 8 pt')
    expect(frames(markup)[1]).toStartWith('Build 2 11 pt')
    expect(text(/data-slot="flow-lane"[\s\S]*?<\/section>/.exec(markup)![0])).toContain('Build 2 11 pt')
  })

  test('a kind filter that empties a phase says which kind is missing there', () => {
    const markup = html(<Board cards={[card({ kind: 'fix' })]} options={{ ...BOARD, kind: 'fix' }} base="/personal" />)
    expect(frames(markup)[3]).toContain('No fix items in Done')
  })

  test('a card links to its item; its last line names the first flag before the next move, and a move of the owner rings it', () => {
    const markup = html(<Board cards={[card({ flags: ['Q2 blocks'], next: { owner: true, skill: 'owner: /gate approve SHOP-12' } }), card({ id: 'SHOP-13', next: { owner: false, skill: '/cook SHOP-13' } })]} options={BOARD} base="/personal" />)
    const [held, free] = [...markup.matchAll(/<a data-slot="item-card"[\s\S]*?<\/a>/g)].map(found => found[0])
    expect(held).toContain('href="/personal/works/SHOP-12" data-needs="true"')
    expect(text(held!)).toEndWith('Q2 blocks 2/5')
    expect(text(free!)).toEndWith('The lead runs /cook 2/5')
  })

  test('grouped by who holds it, the list shows one group for each holder', () => {
    const cards = [card({ id: 'SHOP-1', state: 'backlog', next: { owner: false, skill: '/triage SHOP-1' } }), card({ next: { owner: true, skill: 'owner: /gate accept SHOP-12' } }), card({ id: 'SHOP-13' })]
    const markup = html(<Board cards={cards} options={{ ...BOARD, layout: 'list', group: 'holder' }} base="/personal" />)
    expect([...markup.matchAll(/<details open="" data-slot="item-group"[\s\S]*?<\/summary>/g)].map(found => text(found[0]))).toEqual(['Waits for you 1 0 pt', 'The lead runs 1 0 pt', 'Backlog 1 0 pt'])
  })

  test('a row of the list holds the next move and the links to the item and its spec', () => {
    const markup = html(<Board cards={[card()]} options={{ ...BOARD, layout: 'list' }} base="/personal" />)
    const row = /<details data-slot="item-row"[\s\S]*?<\/details>/.exec(markup)![0]
    expect(text(row.slice(row.indexOf('</summary>')))).toBe('The lead runs /cook SHOP-12 Open the item Read the spec')
    expect(row).toContain('href="/personal/works/SHOP-12?tab=spec"')
  })

  test('says so when the desk has no item', () => {
    expect(text(html(<Board cards={[]} options={BOARD} base="/personal" />))).toBe('No item yet Type /intake in the agent session to start one.')
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
    expect(markup).toMatch(/data-slot="badge" data-tone="success"[^>]*>ADD</)
    expect(text(markup)).toBe('AC1 ADD the export has the right date open')
  })
})

describe('Diagram', () => {
  test('holds its spec for the Bench library, safe inside the page', () => {
    const markup = html(<Diagram spec={{ type: 'filetree', items: [{ name: '</script><b>x' }] }} />)
    expect(markup).toBe('<div data-slot="diagram" data-diagram="{&quot;type&quot;:&quot;filetree&quot;,&quot;items&quot;:[{&quot;name&quot;:&quot;&lt;/script&gt;&lt;b&gt;x&quot;}]}" class="min-w-0"></div>')
  })
})

describe('isCurrentPage', () => {
  test('marks the page of an address and of each address under it; the home of a desk marks only itself', () => {
    expect(isCurrentPage('/personal/works/SHOP-12', '/personal/works', '/personal')).toBe(true)
    expect(isCurrentPage('/personal/works', '/personal/works', '/personal')).toBe(true)
    expect(isCurrentPage('/personal/works/SHOP-12', '/personal', '/personal')).toBe(false)
    expect(isCurrentPage('/personal', '/personal', '/personal')).toBe(true)
  })
})

describe('Gap', () => {
  test('shows a gap of the desk and its fix in place of the data', () => {
    const markup = html(<Gap error={refused('the ledger needs 1 migration', 'run any `nook eng` command in the desk')} />)
    expect(markup).toContain('data-slot="alert" data-tone="warning"')
    expect(text(markup)).toBe('! The ledger needs 1 migration Fix: run any `nook eng` command in the desk')
  })
})
