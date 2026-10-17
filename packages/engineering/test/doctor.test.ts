import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { doctor } from '../src/report/doctor.ts'
import { itemAt, LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('doctor', () => {
  test('lists each gap of the pack in the home with its fix', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.ledger.run("UPDATE item SET areas = '[\"bff\",\"ghost\"]' WHERE id = 'SHOP-1'")
    lead.newItem({ id: 'SHOP-2', title: 'b', areas: ['bff'], state: 'cooking' })
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('wait', 'SHOP-1', 'T1', { reason: 'the schema' })
    const plan = join(t.root, 'work', 'SHOP-1', 'plan.md')
    writeFileSync(plan, `${readFileSync(plan, 'utf8')}\nchanged\n`)
    lead.ask('SHOP-2', 'what?', true)
    lead.ledger.run("UPDATE question SET asked_at = '2026-01-01T00:00:00.000Z'")
    const found = doctor(lead)
    const texts = found.map(f => f.text)
    expect(texts).toContain('SHOP-1 names an area that nook.yml does not have: ghost')
    expect(texts).toContain('SHOP-1: plan.md changed after the approve')
    expect(texts).toContain('SHOP-1 T1 is waiting: the schema')
    expect(texts).toContain('SHOP-2 is cooking with no slice')
    expect(texts).toContain('two items cook in area bff: SHOP-1, SHOP-2')
    expect(texts).toContain('SHOP-2 Q1 has blocked for more than a day: what?')
    expect(texts).toContain('backlog/ is missing')
    expect(found.every(f => f.fix && f.where && ['error', 'warn'].includes(f.level))).toBe(true)
    const bare = makeHome({ section: false })
    try {
      expect(doctor(bare.eng()).map(f => f.text)[0]).toContain('no engineering section')
    } finally {
      bare.cleanup()
    }
  })
})
