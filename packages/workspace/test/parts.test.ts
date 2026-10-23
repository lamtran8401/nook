import { describe, expect, test } from 'bun:test'

import { hooks, parts } from '../src/parts.ts'

describe('parts', () => {
  test('gives each agent and skill of the plugin with the first sentence of its job, the agents first', () => {
    const all = parts()
    expect(all).toContainEqual({ kind: 'agent', name: 'scout', job: 'Reads code and tickets and reports facts with path and line, guesses marked, in 40 lines or fewer.' })
    expect(all).toContainEqual(expect.objectContaining({ kind: 'skill', name: 'setup' }))
    expect(all.findIndex(p => p.kind === 'skill')).toBeGreaterThan(all.findLastIndex(p => p.kind === 'agent'))
  })
  test('gives each hook of the plugin: its event, the tools it matches and the nook commands it runs', () => {
    const all = hooks()
    expect(all).toContainEqual({ event: 'PreToolUse', matcher: 'Bash', commands: ['nook hook bash', 'nook eng hook bash', 'nook issues hook bash'] })
    expect(all).toContainEqual({ event: 'Stop', matcher: null, commands: ['nook eng hook stop'] })
    expect(all[0]?.event).toBe('PreToolUse')
  })
})
