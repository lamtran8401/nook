import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { Exit } from '@nook/shared/errors.ts'

import { ChildrenDone } from '../src/guards/children.ts'
import { GuardContext } from '../src/guards/guard.ts'
import { itemBrief } from '../src/report/item-brief.ts'
import { fails, LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
  const lead = t.eng(LEAD)
  lead.newItem({ id: 'SHOP-1', title: 'filter orders by status', areas: ['bff'] })
  lead.newItem({ id: 'SHOP-31', title: 'the filter drops the last page', kind: 'fix', areas: ['bff'], parent: 'SHOP-1' })
})
afterEach(() => t.cleanup())

const gaps = () => {
  const eng = t.eng(LEAD)
  return new ChildrenDone().check(new GuardContext(t.home, eng.stores, eng.item('SHOP-1')))
}

describe('the parent of an item', () => {
  test('an item names its parent, and the parent names its children with their state', () => {
    const lead = t.eng(LEAD)
    expect(lead.item('SHOP-31').parent).toBe('SHOP-1')
    expect(itemBrief(lead, 'SHOP-31')).toMatch(/\nparent: SHOP-1(\n|$)/)
    expect(itemBrief(lead, 'SHOP-1')).toMatch(/\nchildren: SHOP-31 \(backlog\)(\n|$)/)
  })

  test('a parent that is not in the ledger is refused', () => {
    fails(() => t.eng(LEAD).newItem({ id: 'SHOP-32', title: 'x', parent: 'SHOP-99' }), Exit.error, 'no item SHOP-99 in the ledger')
  })

  test('accept of a parent waits for each open child, and names it', () => {
    expect(gaps()).toEqual([{ text: 'SHOP-31 is backlog: a sub-item of SHOP-1 is open', fix: 'finish SHOP-31, or nook eng item detach SHOP-31 --reason "<why>"' }])
  })

  test('a child that is done or cancelled lets the parent pass', () => {
    t.eng(LEAD).moveItem('cancel', 'SHOP-31', { reason: 'a duplicate of SHOP-30' })
    expect(gaps()).toEqual([])
  })

  test('detach takes a child out of its parent with a reason in the ledger, and the parent passes', () => {
    const lead = t.eng(LEAD)
    fails(() => lead.detachItem('SHOP-31', ''), Exit.usage, 'detach needs --reason "<why>"')
    lead.detachItem('SHOP-31', 'too small for this sprint')
    expect(lead.item('SHOP-31').parent).toBeNull()
    expect(lead.stores.events.last('SHOP-31', 'detach')?.reason).toBe('from SHOP-1: too small for this sprint')
    expect(gaps()).toEqual([])
    fails(() => lead.detachItem('SHOP-31', 'again'), Exit.refused, 'SHOP-31 has no parent')
  })
})
