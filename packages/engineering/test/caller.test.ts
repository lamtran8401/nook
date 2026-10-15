import { describe, expect, test } from 'bun:test'

import { Caller } from '../src/hooks/caller.ts'
import { BUILDER_AGENT, REVIEWER, SCOUT, VERIFIER } from './hook-inputs.ts'

describe('Caller.from', () => {
  test('an event with no agent type and no agent id is the lead', () => {
    expect(Caller.from({})).toEqual({ role: 'lead', actor: 'lead', kind: 'lead' })
  })

  test('a type that ends in builder is a builder, with the type and the last four characters of the id as actor', () => {
    expect(Caller.from(BUILDER_AGENT)).toEqual({ role: 'builder', actor: 'backend-builder-ab12', kind: 'builder' })
    expect(Caller.from({ agent_type: 'frontend-builder', agent_id: 'x9' })).toMatchObject({ role: 'builder', actor: 'frontend-builder-x9' })
  })

  test('an in-process teammate with an id and no type is a builder, never the lead', () => {
    expect(Caller.from({ agent_id: 'team-77ab' })).toEqual({ role: 'builder', actor: 'teammate-builder-77ab', kind: 'builder' })
  })

  test('the verifier and the reviewer are readers of their own kind', () => {
    expect(Caller.from(VERIFIER)).toMatchObject({ role: 'reader', kind: 'verifier' })
    expect(Caller.from(REVIEWER)).toMatchObject({ role: 'reader', kind: 'reviewer' })
  })

  test('the other read-only agents of the pack are plain readers', () => {
    expect(Caller.from({ agent_type: 'kit-engineering:code-reviewer', agent_id: 'a' })).toMatchObject({ role: 'reader', kind: 'reader' })
    expect(Caller.from(SCOUT)).toMatchObject({ role: 'reader', kind: 'reader', actor: 'scout-0001' })
    expect(Caller.from({ agent_type: 'kit-engineering:skeptic', agent_id: 'b' })).toMatchObject({ role: 'reader' })
  })

  test('an agent that is not of the pack works for the lead, so it gets the rules of the lead', () => {
    expect(Caller.from({ agent_type: 'general-purpose', agent_id: 'agent-5378' })).toEqual({ role: 'lead', actor: 'general-purpose-5378', kind: 'lead' })
    expect(Caller.from({ agent_type: 'Explore', agent_id: 'agent-0002' })).toMatchObject({ role: 'lead' })
  })
})
