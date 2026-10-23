import { describe, expect, test } from 'bun:test'
import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { BACKLOG, boardHref, boardOptions, flagOf, folds, holderGroups, laneOf, PHASES, phaseColumns, phaseGroups, visibleCards } from '@/lib/board.ts'

const card = (id: string, state: BoardCard['state'], fields: Partial<BoardCard> = {}): BoardCard => ({
  id, title: `item ${id}`, kind: 'feature', size: 'M', points: null, mode: 'normal', state, blocked_from: null, areas: ['api'],
  criteria: { met: 0, total: 0 }, slices: { done: 0, total: 0 }, next: { owner: false, skill: `/specify ${id}` }, flags: [], ...fields,
})

const cards = [
  card('SHOP-46', 'backlog', { points: 2 }),
  card('SHOP-45', 'framing', { points: 5 }),
  card('SHOP-43', 'planning', { points: 5, next: { owner: true, skill: 'owner: /gate approve SHOP-43' } }),
  card('SHOP-47', 'ready', { points: 1, kind: 'chore' }),
  card('SHOP-42', 'cooking', { points: 8 }),
  card('SHOP-48', 'blocked', { blocked_from: 'cooking', kind: 'fix' }),
  card('SHOP-44', 'review', { points: 3, next: { owner: true, skill: 'owner: /gate accept SHOP-44' } }),
  card('SHOP-41', 'done', { points: 3, next: { owner: true, skill: 'owner: /close SHOP-41' } }),
]

describe('the board of a workspace', () => {
  test('four phases hold the steps: Shape framing and planning, Build ready and cooking, Review, Done', () => {
    expect(phaseColumns(cards).map(c => `${c.phase.name}:${c.cards.map(x => x.id).join(',')}`)).toEqual([
      'Shape:SHOP-45,SHOP-43',
      'Build:SHOP-47,SHOP-42,SHOP-48',
      'Review:SHOP-44',
      'Done:SHOP-41',
    ])
  })

  test('a blocked item stays in the phase of the step it was blocked from', () => {
    expect(phaseColumns(cards).find(c => c.cards.some(x => x.id === 'SHOP-48'))?.phase.name).toBe('Build')
  })

  test('the lane counts each phase, its points and the items that wait for the owner', () => {
    expect(laneOf(cards).map(s => `${s.name} ${s.count} ${s.points}pt ${s.waits}w`)).toEqual(['Shape 2 10pt 1w', 'Build 3 9pt 0w', 'Review 1 3pt 1w', 'Done 1 3pt 1w'])
  })

  test('who holds each item: the owner when the next move is theirs, else the lead, ready, backlog or done', () => {
    expect(holderGroups(cards).map(g => `${g.holder.key}:${g.cards.map(x => x.id).join(',')}`)).toEqual([
      'you:SHOP-43,SHOP-44,SHOP-41',
      'lead:SHOP-45,SHOP-42,SHOP-48',
      'ready:SHOP-47',
      'backlog:SHOP-46',
    ])
  })

  test('the list by phase has a group for each phase that holds an item, then the backlog', () => {
    expect(phaseGroups(cards).map(g => g.phase.name)).toEqual(['Shape', 'Build', 'Review', 'Done', 'Backlog'])
    expect(phaseGroups([card('SHOP-1', 'review'), card('SHOP-2', 'backlog')]).map(g => g.phase.name)).toEqual(['Review', 'Backlog'])
  })

  test('a kind filter keeps the items of that kind', () => {
    expect(visibleCards(cards, { kind: 'fix', view: 'all' }).map(c => c.id)).toEqual(['SHOP-48'])
    expect(visibleCards(cards, { kind: 'all', view: 'all' })).toHaveLength(8)
  })

  test('the view Needs me keeps the items whose next move is the owner\'s, and Running keeps the items the lead runs', () => {
    expect(visibleCards(cards, { kind: 'all', view: 'mine' }).map(c => c.id)).toEqual(['SHOP-43', 'SHOP-44', 'SHOP-41'])
    expect(visibleCards(cards, { kind: 'all', view: 'running' }).map(c => c.id)).toEqual(['SHOP-45', 'SHOP-42', 'SHOP-48'])
    expect(visibleCards(cards, { kind: 'fix', view: 'mine' })).toEqual([])
  })

  test('the address picks the view, the layout, the grouping and the kind; anything else falls back to all items on the board by phase', () => {
    expect(boardOptions({ view: 'mine', layout: 'list', group: 'holder', kind: 'fix' })).toEqual({ view: 'mine', layout: 'list', group: 'holder', kind: 'fix' })
    expect(boardOptions({ view: 'later', layout: 'grid', group: ['x'], kind: 'bug' })).toEqual({ view: 'all', layout: 'board', group: 'phase', kind: 'all' })
  })

  test('the address of a view keeps the other options and leaves each default out', () => {
    const options = boardOptions({ kind: 'fix' })
    expect(boardHref('/shop', options, { view: 'running' })).toBe('/shop/works?view=running&kind=fix')
    expect(boardHref('/shop', options, { kind: 'all' })).toBe('/shop/works')
  })

  test('a done item that waits for its /close waits for the owner, as the inbox says, so it is in Needs me and keeps Done open', () => {
    const closing = card('SHOP-40', 'done', { next: { owner: false, skill: '/close SHOP-40' } })
    expect(holderGroups([closing]).map(g => g.holder.key)).toEqual(['you'])
    expect(visibleCards([closing], { kind: 'all', view: 'mine' }).map(c => c.id)).toEqual(['SHOP-40'])
    expect(folds(PHASES[3]!, [closing])).toBe(false)
  })

  test('Done and the backlog fold to a strip while none of their items waits for the owner; a busy phase never folds', () => {
    const [shape, , , done] = PHASES
    expect(folds(BACKLOG, [card('SHOP-46', 'backlog')])).toBe(true)
    expect(folds(done!, [card('SHOP-40', 'done', { next: { owner: false, skill: 'closed' } })])).toBe(true)
    expect(folds(done!, [card('SHOP-41', 'done', { next: { owner: true, skill: 'owner: /close SHOP-41' } })])).toBe(false)
    expect(folds(shape!, [card('SHOP-45', 'framing')])).toBe(false)
    expect(folds(BACKLOG, [])).toBe(false)
  })

  test('the last line of a card says who holds the next move, with the dot of its tone', () => {
    expect([
      flagOf(card('SHOP-1', 'cooking', { flags: ['Q2 blocks'], next: { owner: true, skill: 'answer Q2: nook eng answer SHOP-1 Q2' } })),
      flagOf(card('SHOP-2', 'planning', { next: { owner: true, skill: 'owner: /gate approve SHOP-2' } })),
      flagOf(card('SHOP-3', 'framing', { next: { owner: false, skill: '/specify SHOP-3' } })),
      flagOf(card('SHOP-4', 'done', { next: { owner: false, skill: '/close SHOP-4' } })),
      flagOf(card('SHOP-5', 'done', { next: { owner: false, skill: 'closed' } })),
    ]).toEqual([
      { words: 'Q2 blocks', tone: 'danger' },
      { words: 'waits for your approve', tone: 'danger' },
      { words: 'the lead runs /specify', tone: 'violet' },
      { words: 'waits for /close', tone: 'warning' },
      { words: 'done' },
    ])
  })
})
