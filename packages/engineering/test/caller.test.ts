import { describe, expect, test } from 'bun:test'

import { Caller } from '../src/hooks/caller.ts'
import { BUILDER_AGENT, REVIEWER, SCOUT, VERIFIER } from './hook-inputs.ts'

describe('Caller.from', () => {
  test('no agent type is the lead; a type that ends in builder is a builder; others are readers with their kind', () => {
    expect(Caller.from({})).toEqual({ role: 'lead', actor: 'lead', kind: 'lead' })
    expect(Caller.from(BUILDER_AGENT)).toEqual({ role: 'builder', actor: 'backend-builder-ab12', kind: 'builder' })
    expect(Caller.from({ agent_type: 'frontend-builder', agent_id: 'x9' })).toMatchObject({ role: 'builder', actor: 'frontend-builder-x9' })
    // an in-process teammate can come with an id and no type: it is a builder, never the lead
    expect(Caller.from({ agent_id: 'team-77ab' })).toEqual({ role: 'builder', actor: 'teammate-builder-77ab', kind: 'builder' })
    expect(Caller.from(VERIFIER)).toMatchObject({ role: 'reader', kind: 'verifier' })
    expect(Caller.from(REVIEWER)).toMatchObject({ role: 'reader', kind: 'reviewer' })
    expect(Caller.from({ agent_type: 'kit-engineering:code-reviewer', agent_id: 'a' })).toMatchObject({ role: 'reader', kind: 'reader' })
    expect(Caller.from(SCOUT)).toMatchObject({ role: 'reader', kind: 'reader', actor: 'scout-0001' })
  })
})
