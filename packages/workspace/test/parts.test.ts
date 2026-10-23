import { describe, expect, test } from 'bun:test'

import { parts } from '../src/parts.ts'

describe('parts', () => {
  test('gives each agent and skill of the plugin with the first sentence of its job, the agents first', () => {
    const all = parts()
    expect(all).toContainEqual({ kind: 'agent', name: 'scout', job: 'Reads code and tickets and reports facts with path and line, guesses marked, in 40 lines or fewer.' })
    expect(all).toContainEqual(expect.objectContaining({ kind: 'skill', name: 'setup' }))
    expect(all.findIndex(p => p.kind === 'skill')).toBeGreaterThan(all.findLastIndex(p => p.kind === 'agent'))
  })
})
