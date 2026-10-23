import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { subagentStop } from '../src/hooks/subagent-stop.ts'
import { pickup } from '../src/report/item-brief.ts'
import { BUILDER, itemAt, LEAD, makeHome, type TestHome } from './helpers.ts'
import { BUILDER_AGENT, reason, SCOUT } from './hook-inputs.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('subagentStop', () => {
  test('a builder with a running slice is held once, and let go when the slice is done', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    t.eng(BUILDER).moveSlice('start', 'SHOP-1', 'T1')
    const held = subagentStop({ cwd: t.root, ...BUILDER_AGENT })
    expect(reason(held)).toContain('nook eng task done SHOP-1 T1')
    expect(subagentStop({ cwd: t.root, ...BUILDER_AGENT, stop_hook_active: true }).kind).toBe('pass')
    expect(subagentStop({ cwd: t.root, agent_type: 'frontend-builder', agent_id: 'zz99' }).kind).toBe('pass')
    expect(subagentStop({ cwd: t.root, ...SCOUT }).kind).toBe('pass')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['a'] })
    expect(subagentStop({ cwd: t.root, ...BUILDER_AGENT }).kind).toBe('pass')
  })

  test('an agent that ends is logged once on the item that the session leads', () => {
    itemAt(t, 'cooking')
    pickup(t.eng(LEAD), 'SHOP-1')
    subagentStop({ cwd: t.root, session_id: 'sess-1', ...SCOUT })
    subagentStop({ cwd: t.root, session_id: 'sess-1', ...SCOUT })
    subagentStop({ cwd: t.root, session_id: 'sess-1', agent_type: 'nook:reviewer', agent_id: 'agent-ef56' })
    const agents = t.eng(LEAD).stores.events.history('SHOP-1').filter(e => e.type === 'agent').map(e => e.reason)
    expect(agents).toEqual(['scout', 'reviewer'])
  })

  test('an agent of a session that leads no item is not logged', () => {
    itemAt(t, 'cooking')
    subagentStop({ cwd: t.root, session_id: 'stray', ...SCOUT })
    expect(t.eng(LEAD).stores.events.history('SHOP-1').filter(e => e.type === 'agent')).toEqual([])
  })
})
