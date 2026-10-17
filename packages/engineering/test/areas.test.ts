import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { areaStatus } from '../src/report/areas.ts'
import { itemAt, LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('areaStatus', () => {
  test('names the branch, the dirty files and the item in cooking of each area', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    writeFileSync(join(t.area('bff'), 'dirty.txt'), 'x')
    const status = areaStatus(lead)
    expect(status[0]).toMatchObject({ area: 'bff', branch: 'nook/SHOP-1-work', dirty: 1, item: 'SHOP-1', exists: true })
    expect(status[1]).toMatchObject({ area: 'web', branch: 'main', dirty: 0, item: null })
  })
})
