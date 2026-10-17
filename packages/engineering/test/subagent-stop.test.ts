import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { subagentStop } from '../src/hooks/subagent-stop.ts'
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
})
