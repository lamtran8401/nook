import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { brief, doneSince, runs } from '../src/report/brief.ts'
import { itemAt, LEAD, makeHome, PLAN, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('brief', () => {
  test('the owner steps are now; failed slices and an item cooking with no activity for a day are today', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.kit(LEAD)
    lead.newItem({ id: 'SHOP-2', title: 'b', areas: ['web'] })
    lead.ask('SHOP-2', 'what?', true)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('fail', 'SHOP-1', 'T1', { reason: 'cannot' })
    lead.ledger.run("UPDATE item SET updated = '2026-01-01T00:00:00.000Z' WHERE id = 'SHOP-1'")
    const lines = brief(lead)
    expect(lines.every(l => l.pack === 'engineering' && l.text && l.action && l.ref)).toBe(true)
    expect(lines.map(l => [l.urgency, l.ref])).toEqual([['today', 'SHOP-1'], ['today', 'SHOP-1'], ['now', 'SHOP-2']])
    expect(lines[0]!.text).toContain('T1 failed: cannot')
    expect(lines[2]!.action).toBe('kit eng answer SHOP-2 Q1 "<answer>"')
    itemAt(t, 'planning', 'SHOP-3')
    writeDoc(t, 'SHOP-3', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-3', 'tasks.md', TASKS([{ id: 'T1' }]))
    lead.importTasks('SHOP-3')
    expect(brief(lead).find(l => l.ref === 'SHOP-3')).toMatchObject({ urgency: 'now', action: '/gate approve SHOP-3' })
  })
})

describe('doneSince', () => {
  test('an item accepted since the time is done, and closed when its archive came after', () => {
    itemAt(t, 'planning')
    itemAt(t, 'planning', 'SHOP-2')
    const lead = t.kit(LEAD)
    lead.ledger.run("UPDATE item SET state = 'done' WHERE id IN ('SHOP-1', 'SHOP-2')")
    lead.ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-1', 'accept', 'checking', 'done', 'owner', 'owner', '2026-10-16T09:00:00.000Z')")
    lead.ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-1', 'archive', NULL, NULL, 'lead', 'lead', '2026-10-16T10:00:00.000Z')")
    lead.ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-2', 'accept', 'checking', 'done', 'owner', 'owner', '2026-10-14T09:00:00.000Z')")
    expect(doneSince(lead, new Date('2026-10-15T00:00:00.000Z'))).toEqual([{ ref: 'SHOP-1', text: 'SHOP-1 closed: the export date is off' }])
  })
})

describe('runs', () => {
  test('an open item that waits for nobody runs, with its next step and its running slices', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.kit(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.newItem({ id: 'SHOP-2', title: 'b', areas: ['web'] })
    lead.ask('SHOP-2', 'what?', true)
    expect(runs(lead)).toEqual([{ ref: 'SHOP-1', text: 'SHOP-1 cooking: the export date is off; T1 runs in bff', action: '/cook SHOP-1' }])
  })
})
