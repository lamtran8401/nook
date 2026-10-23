import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { Home } from '../src/home.ts'
import { doctor } from '../src/report/doctor.ts'
import { Engineering } from '../src/service.ts'
import { itemAt, LEAD, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('doctor', () => {
  test('names the move of an old tracker key to the issue-tracker feature, with its fix', () => {
    const file = join(t.root, 'nook.yml')
    writeFileSync(file, readFileSync(file, 'utf8').replace('  backlog: backlog\n', '  backlog: backlog\n  tracker: { type: none }\n'))
    const found = doctor(Engineering.open(Home.find(t.root)!, LEAD)).find(f => f.text.startsWith('engineering.tracker'))
    expect(found).toEqual({
      level: 'warn',
      where: t.root,
      text: 'engineering.tracker moved to the issue-tracker feature: Nook reads it no more',
      fix: 'delete tracker: from the engineering section of nook.yml; to pull tickets, run nook init --with issue-tracker, then /setup',
    })
  })


  test('leaves a failed or waiting slice to the brief: it is the state of the work, not a gap', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('wait', 'SHOP-1', 'T1', { reason: 'the schema' })
    expect(doctor(lead).map(f => f.text).filter(text => text.includes('T1'))).toEqual([])
  })

  test('lists each gap of engineering in the home with its fix', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.ledger.run("UPDATE item SET areas = '[\"bff\",\"ghost\"]' WHERE id = 'SHOP-1'")
    lead.newItem({ id: 'SHOP-2', title: 'b', areas: ['bff'], state: 'cooking' })
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('wait', 'SHOP-1', 'T1', { reason: 'the schema' })
    const plan = join(t.root, 'works', 'SHOP-1', 'plan.md')
    writeFileSync(plan, `${readFileSync(plan, 'utf8')}\nchanged\n`)
    lead.ask('SHOP-2', 'what?', true)
    lead.ledger.run("UPDATE question SET asked_at = '2026-01-01T00:00:00.000Z'")
    const found = doctor(lead)
    const texts = found.map(f => f.text)
    expect(texts).toContain('SHOP-1 names an area that nook.yml does not have: ghost')
    expect(texts).toContain('SHOP-1: plan.md changed after the approve')
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
