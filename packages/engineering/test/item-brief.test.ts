import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { itemBrief, pickup } from '../src/report/item-brief.ts'
import { itemAt, LEAD, makeHome, READER, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('itemBrief', () => {
  test('the brief holds the state, the next step, the areas, the criteria, the slices and stays under 1800 characters', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS(Array.from({ length: 30 }, (_, i) => ({ id: `T${i + 1}`, title: `a long slice title number ${i + 1} that goes on and on for a while` }))))
    const lead = t.eng(LEAD)
    lead.ask('SHOP-1', 'which zone?', false, 'UTC')
    const text = itemBrief(lead, 'SHOP-1')
    expect(text.length).toBeLessThanOrEqual(1800)
    expect(text).toContain('state: cooking  mode: normal')
    expect(text).toContain('next: /cook SHOP-1')
    expect(text).toContain('bff → projects/bff (backend)')
    expect(text).toContain('[ ] 1 [ADD] the export has the right date')
    expect(text).toContain('T1 todo bff')
    expect(text).toContain('… and')
    expect(text).toContain('Q1 which zone? → rec: UTC')
  })
})

describe('pickup', () => {
  test('pickup records the session and prints the brief plus handoff.md', () => {
    itemAt(t, 'framing')
    const lead = t.eng(LEAD)
    writeDoc(t, 'SHOP-1', 'handoff.md', '# handoff\n\n## Next\n\nwrite the spec\n')
    const out = pickup(lead, 'SHOP-1')
    expect(out).toContain('SHOP-1 — the export date is off')
    expect(out).toContain('--- handoff.md ---')
    expect(out).toContain('write the spec')
    expect(lead.ledger.get<{ item: string; role: string }>('SELECT item, role FROM session WHERE id = ?', 'sess-1')).toEqual({ item: 'SHOP-1', role: 'lead' })
    expect(() => pickup(t.eng(READER), 'SHOP-1')).toThrow(/pickup/)
  })
})
