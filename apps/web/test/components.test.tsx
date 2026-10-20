import { describe, expect, test } from 'bun:test'

import type { BoardCard } from '@nook/engineering/read/reader.ts'
import { refused } from '@nook/shared/errors.ts'

import { Board } from '@/components/board.tsx'
import { Criteria } from '@/components/criteria.tsx'
import { Diagram } from '@/components/diagram.tsx'
import { Gap } from '@/components/gap.tsx'
import { isCurrentPage } from '@/components/desk-nav.tsx'
import { html, text } from '@/test/markup.ts'

const card = (fields: Partial<BoardCard> = {}): BoardCard => ({
  id: 'SHOP-12', title: 'Filter shipments by status', kind: 'feature', size: 'M', state: 'cooking', areas: ['api', 'web'], criteria: { met: 1, total: 3 },
  slices: { done: 2, total: 5 }, next: { owner: false, skill: '/cook SHOP-12' }, flags: [], ...fields,
})

const specOf = (markup: string) => JSON.parse(/data-diagram="([^"]*)"/.exec(markup)![1]!.replaceAll('&quot;', '"').replaceAll('&amp;', '&'))

/** The cards of every column of a board spec, in the order of the columns. */
const cardsOf = (spec: { columns: { cards: unknown[] }[] }) => spec.columns.flatMap(column => column.cards) as Record<string, unknown>[]

describe('Board', () => {
  test('draws the Bench board with a column for each state of the flow in its order, the empty ones too, and no panel of empty states', () => {
    const spec = specOf(html(<Board cards={[card({ id: 'SHOP-3', state: 'done' }), card({ id: 'SHOP-1', state: 'backlog' }), card({ id: 'SHOP-2', state: 'cooking' })]} areas={['api', 'web']} base="/personal" />))
    expect(spec).toMatchObject({ type: 'board', frame: false, emptyText: 'None' })
    expect(spec.columns.map((c: { title: string; cards: unknown[] }) => [c.title, c.cards.length])).toEqual([['backlog', 1], ['framing', 0], ['planning', 0], ['ready', 0], ['cooking', 1], ['review', 0], ['done', 1]])
    expect(spec.rest).toBeUndefined()
  })

  test('a blocked item gets the column blocked before done; with none blocked, the column is left out', () => {
    const spec = specOf(html(<Board cards={[card({ id: 'SHOP-4', state: 'blocked' })]} areas={[]} base="/personal" />))
    expect(spec.columns.map((c: { title: string }) => c.title)).toEqual(['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'blocked', 'done'])
  })

  test('a card links to its item and shows the kind, the size, the areas in their tones, the criteria met and whose move is next', () => {
    const spec = specOf(html(<Board cards={[card()]} areas={['api', 'web']} base="/personal" />))
    expect(cardsOf(spec)[0]).toEqual({
      id: 'SHOP-12', title: 'Filter shipments by status', href: '/personal/works/SHOP-12',
      kind: 'feature', kindTone: 'primary', kindIcon: 'sparkle', size: 'M',
      areas: [{ name: 'api', tone: 'primary' }, { name: 'web', tone: 'violet' }],
      meter: { value: 1, max: 3, text: '1/3 criteria', tone: 'success' },
      note: 'The lead runs /cook', noteIcon: 'bot',
    })
  })

  test('a failed slice rings the card red and a blocking question amber, each named in the foot; a move of the owner names it', () => {
    const spec = specOf(html(<Board cards={[card({ flags: ['Q2 blocks', 'T4 failed'], next: { owner: true, skill: 'owner: /gate approve SHOP-12' } }), card({ id: 'SHOP-13', flags: ['Q1 blocks'] })]} areas={[]} base="/personal" />))
    const [failed, waiting] = cardsOf(spec)
    expect(failed).toMatchObject({ flag: 'fail', note: 'Your move: approve', noteIcon: 'user', foot: [{ icon: 'clock', text: 'Q2 blocks', kind: 'wait' }, { icon: 'alert', text: 'T4 failed', kind: 'fail' }] })
    expect(waiting).toMatchObject({ flag: 'wait', foot: [{ icon: 'clock', text: 'Q1 blocks', kind: 'wait' }] })
  })

  test('a card with no criteria yet has no meter', () => {
    expect(cardsOf(specOf(html(<Board cards={[card({ criteria: { met: 0, total: 0 } })]} areas={[]} base="/personal" />)))[0]!.meter).toBeUndefined()
  })

  test('says so when the desk has no item', () => {
    expect(text(html(<Board cards={[]} areas={[]} base="/personal" />))).toBe('No item yet Type /intake in the agent session to start one.')
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
