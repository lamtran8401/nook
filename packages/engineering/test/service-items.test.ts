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
  test('an item with no id gets the next IT id of the ledger', () => {
    const lead = t.kit(LEAD)
    lead.newItem({ id: 'IT-004', title: 'an older item' })
    expect(lead.newItem({ title: 'Filter shipments by status' })).toMatchObject({ id: 'IT-005', title: 'Filter shipments by status', state: 'backlog' })
  })

  test('an item with an id keeps it', () => {
    expect(t.kit(LEAD).newItem({ id: 'SHOP-12', title: 'Filter by status' }).id).toBe('SHOP-12')
  })
})

describe('Engineering.quick with a title', () => {
  test('a title gets the next IT id', () => {
    const lead = t.kit(LEAD)
    lead.newItem({ id: 'IT-009', title: 'an older item' })
    expect(lead.quick('the web title is wrong', 'web')).toMatchObject({ id: 'IT-010', title: 'the web title is wrong', state: 'cooking' })
  })
})
