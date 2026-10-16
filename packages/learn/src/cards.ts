import { usage } from '@kit/shared/errors.ts'

import { MdTable } from './table.ts'

/** The cards of a course, in boxes: a card that the owner knows moves up a box and comes back later; a miss starts over. */

export type Card = { id: string; front: string; back: string; box: number; due: string; last: string }
export type Review = 'good' | 'again'

/** The days until a card comes back, for each box: 1, 2, 4, 8, 16. */
export const INTERVALS = [1, 2, 4, 8, 16] as const

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const next = new Date(Date.UTC(y!, m! - 1, d! + days))
  return next.toISOString().slice(0, 10)
}

export const CARD_COLUMNS = ['Id', 'Front', 'Back', 'Box', 'Due', 'Last']

export class CardDeck {
  private readonly table: MdTable

  constructor(file: string) {
    this.table = new MdTable(file, 'Cards', CARD_COLUMNS)
  }

  list(): Card[] {
    return this.table.rows().map(([id = '', front = '', back = '', box = '1', due = '', last = '']) => ({ id, front, back, box: Number(box), due, last }))
  }

  /** A new card starts in the first box and comes back the next day. */
  add(front: string, back: string, today: string): Card {
    const cards = this.list()
    const next = Math.max(0, ...cards.map(c => Number(c.id.slice(1)) || 0)) + 1
    const card: Card = { id: `C${next}`, front, back, box: 1, due: addDays(today, INTERVALS[0]), last: '' }
    this.save([...cards, card])
    return card
  }

  review(id: string, result: Review, today: string): Card {
    const cards = this.list()
    const card = cards.find(c => c.id === id)
    if (!card) throw usage(`no card ${id}`, 'kit learn due <course> lists the cards')
    card.box = result === 'good' ? Math.min(card.box + 1, INTERVALS.length) : 1
    card.due = addDays(today, INTERVALS[card.box - 1]!)
    card.last = today
    this.save(cards)
    return card
  }

  due(today: string): Card[] {
    return this.list().filter(c => c.due <= today)
  }

  private save(cards: Card[]): void {
    this.table.write(cards.map(c => [c.id, c.front, c.back, String(c.box), c.due, c.last]))
  }
}
