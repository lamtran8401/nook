import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const make = (...ids: string[]) => {
  const lead = t.kit(LEAD)
  for (const id of ids) lead.newItem({ id, title: `item ${id}` })
  return lead.stores.items
}

describe('ItemStore.nextId', () => {
  test('an empty ledger gives IT-001', () => {
    expect(make().nextId()).toBe('IT-001')
  })

  test('the next id is one more than the highest IT number, zero padded', () => {
    expect(make('IT-007', 'IT-012').nextId()).toBe('IT-013')
  })

  test('an old IT-1 counts as 1', () => {
    expect(make('IT-1').nextId()).toBe('IT-002')
  })

  test('past 999 the number grows to four digits', () => {
    expect(make('IT-999').nextId()).toBe('IT-1000')
  })

  test('the ids of a tracker and an IT id with a suffix do not count', () => {
    expect(make('SHOP-40', 'IT-5b').nextId()).toBe('IT-001')
  })
})
