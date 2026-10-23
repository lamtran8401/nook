import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const make = (...ids: string[]) => {
  const lead = t.eng(LEAD)
  for (const id of ids) lead.newItem({ id, title: `item ${id}` })
  return lead.stores.items
}

describe('ItemStore.nextId', () => {
  test('an empty ledger gives the first id of the prefix', () => {
    expect(make().nextId('BUG')).toBe('BUG-001')
  })

  test('the next id is one more than the highest number of its prefix, zero padded', () => {
    expect(make('WI-007', 'WI-012', 'BUG-020').nextId('WI')).toBe('WI-013')
  })

  test('each prefix counts on its own', () => {
    expect(make('WI-001', 'WI-002').nextId('INV')).toBe('INV-001')
  })

  test('an old WI-1 counts as 1', () => {
    expect(make('WI-1').nextId('WI')).toBe('WI-002')
  })

  test('past 999 the number grows to four digits', () => {
    expect(make('CHR-999').nextId('CHR')).toBe('CHR-1000')
  })

  test('the ids of a tracker and an id with a suffix do not count', () => {
    expect(make('SHOP-40', 'WI-5b').nextId('WI')).toBe('WI-001')
  })
})
