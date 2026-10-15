import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BUILDER, itemAt, LEAD, makeHome, OWNER, READER, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('Engineering.addNote', () => {
  test('a note keeps the actor that wrote it, and a reader may not add one', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    t.kit(BUILDER).addNote('SHOP-1', 'a note')
    expect(lead.stores.notes.list('SHOP-1')[0]).toMatchObject({ text: 'a note', by: 'backend-builder-ab12' })
    expect(() => t.kit(READER).addNote('SHOP-1', 'x')).toThrow(/note add/)
  })
})

describe('Engineering.setMode', () => {
  test('the owner sets mode auto, and the item records the owner as the one who set it', () => {
    itemAt(t, 'cooking')
    expect(t.kit(OWNER).setMode('SHOP-1', 'auto')).toMatchObject({ mode: 'auto', mode_by: 'owner' })
  })
})

describe('Engineering.newAdr and setAdrStatus', () => {
  test('an ADR is numbered from 1, then accepted, then superseded by a later one; a reader may not write one', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    const adr = lead.newAdr('Use UTC for export dates', 'SHOP-1')
    expect(adr).toMatchObject({ n: 1, status: 'proposed', item: 'SHOP-1', title: 'Use UTC for export dates' })
    expect(existsSync(join(t.root, 'docs', 'adr', '0001-use-utc-for-export-dates.md'))).toBe(true)
    const second = lead.newAdr('Use local time')
    expect(lead.setAdrStatus(1, 'accepted').status).toBe('accepted')
    expect(lead.setAdrStatus(1, 'superseded', second.n)).toMatchObject({ status: 'superseded', by: 2 })
    expect(lead.stores.adrs.list().map(a => a.status)).toEqual(['superseded', 'proposed'])
    expect(() => t.kit(READER).newAdr('x')).toThrow(/adr/)
  })
})
