import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { criteriaCap, ticketCriteria } from '../src/documents/criteria-cap.ts'
import { itemAt, LEAD, makeHome, SPEC, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome | undefined
afterEach(() => t?.cleanup())

const TICKET = (criteria: string) => `# SHOP-1 the export\n\n## Description\n- not a criterion\n\n## Acceptance criteria\n${criteria}\n## Comments\n- not a criterion\n`

describe('ticketCriteria', () => {
  test('counts the list lines under Acceptance criteria only', () => {
    expect(ticketCriteria(TICKET('- one\n- two\n* three\n4. four\n'))).toBe(4)
  })

  test('a ticket with no file, no section or no list line names no criterion', () => {
    expect(ticketCriteria(null)).toBe(0)
    expect(ticketCriteria('# SHOP-1\n\n## Description\n- text\n')).toBe(0)
    expect(ticketCriteria(TICKET('None in the ticket.\n'))).toBe(0)
  })
})

describe('criteriaCap', () => {
  test('is the count of the ticket + 2, kept in the range of the size', () => {
    expect(criteriaCap('M', 4)).toEqual({ cap: 6, why: "the ticket's 4 + 2, in the range 3 to 6 of size M" })
    expect(criteriaCap('M', 2).cap).toBe(4)
    expect(criteriaCap('M', 9).cap).toBe(6)
    expect(criteriaCap('L', 1).cap).toBe(5)
    expect(criteriaCap('S', 1).cap).toBe(3)
  })

  test('with no criteria in the ticket, it is the top of the range', () => {
    expect(criteriaCap('S', 0)).toEqual({ cap: 3, why: 'the top of the range 1 to 3 of size S, as the ticket names no criterion' })
  })
})

describe('agree over the proposed cap', () => {
  const ticket = (home: TestHome, criteria: string) => {
    mkdirSync(join(home.root, 'backlog', 'SHOP-1'), { recursive: true })
    writeFileSync(join(home.root, 'backlog', 'SHOP-1', 'ticket.md'), TICKET(criteria))
  }
  const acs = (n: number) => Array.from({ length: n }, (_, i) => `[ADD] behavior ${i + 1}`)

  test('moves the item and warns with the cap and its reason', () => {
    t = makeHome()
    itemAt(t, 'framing')
    ticket(t, '- a\n- b\n- c\n- d\n')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ size: 'M', acs: acs(7) }))
    const result = t.kit(LEAD).moveItem('agree', 'SHOP-1')
    expect(result.item.state).toBe('planning')
    expect(result.warnings).toEqual([
      "spec.md has 7 acceptance criteria; the proposed cap is 6: the ticket's 4 + 2, in the range 3 to 6 of size M. Merge them, or keep them for a complex requirement and say why in the Decisions table.",
    ])
  })

  test('within the cap, agree gives no warning', () => {
    t = makeHome()
    itemAt(t, 'framing')
    ticket(t, '- a\n- b\n- c\n- d\n')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ size: 'M', acs: acs(6) }))
    expect(t.kit(LEAD).moveItem('agree', 'SHOP-1').warnings).toEqual([])
  })
})
