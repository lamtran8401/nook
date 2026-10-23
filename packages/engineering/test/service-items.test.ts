import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { idAndTitle } from '../src/service.ts'
import { LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('idAndTitle', () => {
  test('a first word in the form of an id is the id, and the rest is the title', () => {
    expect(idAndTitle(['SHOP-12', 'Filter', 'by', 'status'])).toEqual({ id: 'SHOP-12', title: 'Filter by status' })
  })

  test('with no id, every word is the title', () => {
    expect(idAndTitle(['Filter', 'shipments', 'by', 'status'])).toEqual({ id: undefined, title: 'Filter shipments by status' })
  })

  test('a word in lower case is not an id', () => {
    expect(idAndTitle(['shop-12', 'fix'])).toEqual({ id: undefined, title: 'shop-12 fix' })
  })
})

describe('Engineering.newItem', () => {
  test('an item with no id gets the next id of the prefix of its kind', () => {
    const lead = t.eng(LEAD)
    lead.newItem({ id: 'WI-001', title: 'an older item' })
    lead.newItem({ id: 'WI-002', title: 'another older item' })
    expect(lead.newItem({ title: 'Filter shipments by status' })).toMatchObject({ id: 'WI-003', title: 'Filter shipments by status', state: 'backlog' })
    expect(lead.newItem({ title: 'Fix the date', kind: 'fix' }).id).toBe('BUG-001')
    expect(lead.newItem({ title: 'Why is the export slow?', kind: 'investigate' }).id).toBe('INV-001')
    expect(lead.newItem({ title: 'Update the deps', kind: 'chore' }).id).toBe('CHR-001')
  })

  test('the id of an item stays when its kind changes', () => {
    const lead = t.eng(LEAD)
    const item = lead.newItem({ title: 'Why is the export slow?', kind: 'investigate' })
    lead.editItem(item.id, 'kind', 'fix')
    expect(lead.item('INV-001').kind).toBe('fix')
  })

  test('a prefix that nook.yml names replaces the default one of its kind', () => {
    const custom = makeHome({ extra: '  ids: { fix: FX }\n' })
    try {
      expect(custom.eng(LEAD).newItem({ title: 'Fix the date', kind: 'fix' }).id).toBe('FX-001')
    } finally {
      custom.cleanup()
    }
  })

  test('an item with an id keeps it', () => {
    expect(t.eng(LEAD).newItem({ id: 'SHOP-12', title: 'Filter by status' }).id).toBe('SHOP-12')
  })
})

describe('the points of an item', () => {
  test('an item keeps the story points it was made with, an edit changes them, and none clears them', () => {
    const lead = t.eng(LEAD)
    expect(lead.newItem({ id: 'SHOP-12', title: 'Filter by status', points: 8 }).points).toBe(8)
    expect(lead.editItem('SHOP-12', 'points', '5').points).toBe(5)
    expect(lead.editItem('SHOP-12', 'points', 'none').points).toBeNull()
  })

  test('an item made with no points has none', () => {
    expect(t.eng(LEAD).newItem({ id: 'SHOP-12', title: 'Filter by status' }).points).toBeNull()
  })

  test('points take a number of zero or more', () => {
    const lead = t.eng(LEAD)
    lead.newItem({ id: 'SHOP-12', title: 'Filter by status' })
    expect(() => lead.editItem('SHOP-12', 'points', 'many')).toThrow(expect.objectContaining({ message: 'points must be a number of 0 or more, or none' }))
    expect(() => lead.newItem({ id: 'SHOP-13', title: 'Export the list', points: -1 })).toThrow(expect.objectContaining({ message: 'points must be a number of 0 or more, or none' }))
  })
})

describe('Engineering.quick with a title', () => {
  test('a title gets the next id of the prefix of a fix', () => {
    const lead = t.eng(LEAD)
    lead.newItem({ id: 'BUG-009', title: 'an older item', kind: 'fix' })
    expect(lead.quick('the web title is wrong', 'web')).toMatchObject({ id: 'BUG-010', title: 'the web title is wrong', state: 'cooking' })
  })
})
