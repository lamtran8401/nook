import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookInput } from '@nook/shared/hook.ts'

import { MAX_HOLDS, stopDriver } from '../src/hooks/stop-driver.ts'
import { pickup } from '../src/report/item-brief.ts'
import { itemAt, LEAD, makeHome, OWNER, PLAN, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'
import { reason } from './hook-inputs.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const stop = (extra: Partial<HookInput> = {}) => stopDriver({ cwd: t.root, session_id: 'sess-1', hook_event_name: 'Stop', ...extra })

describe('stopDriver', () => {
  test('a blocking question holds the lead of the item until it is answered', () => {
    itemAt(t, 'framing')
    const lead = t.eng(LEAD)
    expect(stop().kind).toBe('pass')
    pickup(lead, 'SHOP-1')
    expect(stop().kind).toBe('pass')
    lead.ask('SHOP-1', 'which zone?', true)
    const held = stop()
    expect(held.kind).toBe('json')
    expect(reason(held)).toContain('blocking question Q1 is open')
    expect(reason(held)).toContain('"decision":"block"')
    lead.answer('SHOP-1', 'Q1', 'UTC')
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
  })

  test('mode auto: the next stage of the lead, the proceed step, the owner stages let go, 6 holds at most', () => {
    itemAt(t, 'framing')
    const lead = t.eng(LEAD)
    const owner = t.eng(OWNER)
    pickup(lead, 'SHOP-1')
    expect(stop().kind).toBe('pass')
    owner.setMode('SHOP-1', 'auto')
    expect(reason(stop())).toContain('skills/spec/SKILL.md')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    lead.moveItem('agree', 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/recipe/SKILL.md')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    lead.importTasks('SHOP-1')
    const ready = reason(stop({ stop_hook_active: true }))
    expect(ready).toContain('nook eng item proceed SHOP-1')
    expect(ready).toContain('skills/cook/SKILL.md')
    lead.moveItem('proceed', 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/cook/SKILL.md')
    t.git('bff', 'switch', '-q', '-c', 'nook/SHOP-1-x')
    lead.moveItem('begin', 'SHOP-1')
    lead.moveSlice('start', 'SHOP-1', 'T1')
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['a'] })
    lead.verify('SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/cook/SKILL.md')
    lead.moveItem('submit', 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/deep-review/SKILL.md')
    lead.markCriterion('SHOP-1', 1, 'x', 'run')
    lead.markCriterion('SHOP-1', 2, 'y', 'run')
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
    // the owner accepts outside the session; the run ends
    owner.moveItem('accept', 'SHOP-1')
    expect(stop().kind).toBe('pass')
  })

  test('a stuck lead is let go after MAX_HOLDS holds, and stays let go until it moves the item', () => {
    itemAt(t, 'framing')
    const lead = t.eng(LEAD)
    pickup(lead, 'SHOP-1')
    t.eng(OWNER).setMode('SHOP-1', 'auto')
    for (let i = 1; i <= MAX_HOLDS; i++) expect(reason(stop({ stop_hook_active: i > 1 }))).toContain(`hold ${i} of ${MAX_HOLDS}`)
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
    expect(stop().kind).toBe('pass')
    expect(stop().kind).toBe('pass')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    lead.moveItem('agree', 'SHOP-1')
    expect(reason(stop())).toContain(`hold 1 of ${MAX_HOLDS}`)
  })

  test('an auto run lets the lead wait while a background agent works, and counts no hold', () => {
    itemAt(t, 'framing')
    pickup(t.eng(LEAD), 'SHOP-1')
    t.eng(OWNER).setMode('SHOP-1', 'auto')
    const agent = { id: 'a-1', type: 'subagent', status: 'running', agent_type: 'nk-eng:reviewer' }
    expect(stop({ background_tasks: [agent] }).kind).toBe('pass')
    expect(stop({ background_tasks: [{ ...agent, status: 'completed' }] }).kind).toBe('json')
    expect(reason(stop({ stop_hook_active: true }))).toContain(`hold 2 of ${MAX_HOLDS}`)
  })

  test('a blocking question holds the lead even while a background agent works', () => {
    itemAt(t, 'framing')
    const lead = t.eng(LEAD)
    pickup(lead, 'SHOP-1')
    lead.ask('SHOP-1', 'which zone?', true)
    expect(reason(stop({ background_tasks: [{ id: 'a-1', type: 'subagent', status: 'running' }] }))).toContain('blocking question Q1 is open')
  })

  test('the single item in an auto run that no session leads yet holds a session with no item', () => {
    const owner = t.eng(OWNER)
    owner.newItem({ id: 'SHOP-1', title: 'the export date is off' })
    owner.setMode('SHOP-1', 'auto')
    expect(reason(stop({ session_id: 'another' }))).toContain('skills/spec/SKILL.md')
  })

  test('a session that does not lead the auto item is not held', () => {
    itemAt(t, 'cooking')
    t.eng(OWNER).setMode('SHOP-1', 'auto')
    expect(stop({ session_id: 'another' }).kind).toBe('pass')
    expect(reason(stop())).toContain('skills/cook/SKILL.md')
  })

  test('a session that the hook took on is let go once the lead of the item moves it', () => {
    const owner = t.eng(OWNER)
    owner.newItem({ id: 'SHOP-1', title: 'the export date is off' })
    owner.setMode('SHOP-1', 'auto')
    expect(stop({ session_id: 'stray' }).kind).toBe('json')
    t.eng(LEAD).moveItem('start', 'SHOP-1')
    expect(stop({ session_id: 'stray' }).kind).toBe('pass')
    expect(reason(stop())).toContain('skills/spec/SKILL.md')
  })

  test('a background task whose status is not a known running word does not stop the push', () => {
    itemAt(t, 'framing')
    pickup(t.eng(LEAD), 'SHOP-1')
    t.eng(OWNER).setMode('SHOP-1', 'auto')
    expect(stop({ background_tasks: [{ id: 'a-1', type: 'subagent', status: 'finished' }] }).kind).toBe('json')
    expect(stop({ background_tasks: [{ id: 'a-1', type: 'subagent' }] }).kind).toBe('json')
  })

  test('outside a home the Stop hook passes', () => {
    const outside = mkdtempSync(join(tmpdir(), 'nook-eng-out-'))
    expect(stopDriver({ cwd: outside, session_id: 's' }).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})
