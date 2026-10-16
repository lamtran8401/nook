import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { nextText } from '../src/format.ts'
import { next } from '../src/report/next.ts'
import { itemAt, LEAD, makeHome, OWNER, PLAN, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('next', () => {
  test('names the skill for each state, the owner steps first, and starts with what waits for you', () => {
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    lead.newItem({ id: 'SHOP-2', title: 'b', areas: ['web'] })
    itemAt(t, 'planning')
    expect(next(lead, 'SHOP-2')[0]!.skill).toBe('/spec SHOP-2')
    expect(next(lead, 'SHOP-1')[0]).toMatchObject({ skill: '/recipe SHOP-1', owner: false })
    expect(nextText(next(lead))).toMatch(/^Nothing waits for you\./)
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    lead.importTasks('SHOP-1')
    expect(next(lead, 'SHOP-1')[0]).toMatchObject({ skill: 'owner: /gate approve SHOP-1', owner: true })
    const text = nextText(next(lead))
    expect(text.split('\n')[0]).toBe('Waits for you: SHOP-1: /gate approve SHOP-1')
    expect(text.split('\n')[1]).toMatch(/^SHOP-1 {5}planning {2}owner: \/gate approve SHOP-1/)
    owner.moveItem('approve', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('/cook SHOP-1')
    t.git('bff', 'switch', '-q', '-c', 'kit/SHOP-1-x')
    lead.moveItem('begin', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]).toMatchObject({ skill: '/cook SHOP-1', detail: '0/1 slices done, 0 running, 1 ready' })
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['a'] })
    lead.verify('SHOP-1')
    lead.moveItem('submit', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('/quality-check SHOP-1')
    lead.markCriterion('SHOP-1', 1, 'x', 'run')
    lead.markCriterion('SHOP-1', 2, 'y', 'judged')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('owner: /gate accept SHOP-1')
    owner.moveItem('accept', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('/close SHOP-1')
    lead.ask('SHOP-2', 'what?', true)
    expect(next(lead, 'SHOP-2')[0]).toMatchObject({ owner: true })
    expect(next(lead, 'SHOP-2')[0]!.skill).toContain('kit eng answer SHOP-2 Q1')
    lead.answer('SHOP-2', 'Q1', 'this')
    lead.moveItem('block', 'SHOP-2', { reason: 'waits' })
    expect(next(lead, 'SHOP-2')[0]!.skill).toContain('unblock SHOP-2')
  })
})
