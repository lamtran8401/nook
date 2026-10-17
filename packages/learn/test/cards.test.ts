import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { addDays, CardDeck } from '../src/cards.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-cards-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const deck = () => new CardDeck(join(root, 'cards', 'cards.md'))

describe('addDays', () => {
  test('counts calendar days across a month', () => {
    expect([addDays('2026-10-30', 2), addDays('2026-12-31', 1)]).toEqual(['2026-11-01', '2027-01-01'])
  })
})

describe('CardDeck', () => {
  test('a new card is due the next day, and the file is a table that a person reads', () => {
    const card = deck().add('the present perfect with "since"', 'I have lived here since 2020.', '2026-10-16')
    expect(card).toEqual({ id: 'C1', front: 'the present perfect with "since"', back: 'I have lived here since 2020.', box: 1, due: '2026-10-17', last: '' })
    expect(readFileSync(join(root, 'cards', 'cards.md'), 'utf8')).toBe(
      '# Cards\n\n| Id | Front | Back | Box | Due | Last |\n|---|---|---|---|---|---|\n| C1 | the present perfect with "since" | I have lived here since 2020. | 1 | 2026-10-17 | |\n',
    )
  })

  test('a card that you know comes back after 2, 4, 8, then 16 days, and stays at 16', () => {
    const d = deck()
    d.add('a', 'b', '2026-10-01')
    const dues: string[] = []
    let today = '2026-10-02'
    for (let i = 0; i < 5; i++) {
      const card = d.review('C1', 'good', today)
      dues.push(card.due)
      today = card.due
    }
    expect(dues).toEqual(['2026-10-04', '2026-10-08', '2026-10-16', '2026-11-01', '2026-11-17'])
  })

  test('a card that you miss goes back to the first box and comes back the next day', () => {
    const d = deck()
    d.add('a', 'b', '2026-10-01')
    d.review('C1', 'good', '2026-10-02')
    expect(d.review('C1', 'again', '2026-10-04')).toMatchObject({ box: 1, due: '2026-10-05', last: '2026-10-04' })
  })

  test('the due cards of a day are the ones whose day has come', () => {
    const d = deck()
    d.add('a', 'b', '2026-10-01')
    d.add('c', 'd', '2026-10-05')
    expect(d.due('2026-10-02').map(c => c.id)).toEqual(['C1'])
    expect(d.due('2026-10-06').map(c => c.id)).toEqual(['C1', 'C2'])
  })

  test('a bar in a card keeps the table whole', () => {
    const d = deck()
    d.add('either | or', 'a | b', '2026-10-01')
    expect(deck().list()[0]).toMatchObject({ front: 'either | or', back: 'a | b' })
  })

  test('a card that does not exist is refused', () => {
    expect(() => deck().review('C9', 'good', '2026-10-01')).toThrow('no card C9')
  })
})
