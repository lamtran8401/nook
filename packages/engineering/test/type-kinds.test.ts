import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { Exit } from '@nook/shared/errors.ts'

import { fails, LEAD, makeHome, OWNER, READER, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('the kind of each ticket type, learned in the workspace', () => {
  test('kind set keeps the kind of a type, and a second set replaces it', () => {
    const lead = t.eng(LEAD)
    lead.setTypeKind('Sub-Bug', 'fix')
    lead.setTypeKind('Kaizen', 'chore')
    t.eng(OWNER).setTypeKind('Kaizen', 'investigate')
    expect(lead.typeKinds()).toEqual([{ type: 'Kaizen', kind: 'investigate' }, { type: 'Sub-Bug', kind: 'fix' }])
  })

  test('a kind that engineering does not have is refused', () => {
    fails(() => t.eng(LEAD).setTypeKind('Bug', 'defect'), Exit.usage, 'kind must be one of feature, fix, chore, investigate')
  })

  test('a reader cannot change the map', () => {
    fails(() => t.eng(READER).setTypeKind('Bug', 'fix'), Exit.denied)
  })

  test('item new with a type takes the kind of the map; a kind given wins; a type that the map does not know keeps the default', () => {
    const lead = t.eng(LEAD)
    lead.setTypeKind('Sub-Bug', 'fix')
    expect(lead.newItem({ id: 'SHOP-31', title: 'the filter drops a page', type: 'Sub-Bug' }).kind).toBe('fix')
    expect(lead.newItem({ id: 'SHOP-32', title: 'x', type: 'Sub-Bug', kind: 'chore' }).kind).toBe('chore')
    expect(lead.newItem({ id: 'SHOP-33', title: 'y', type: 'Story' }).kind).toBe('feature')
  })
})
