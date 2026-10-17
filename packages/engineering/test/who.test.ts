import { describe, expect, test } from 'bun:test'

import { EvError, Exit } from '@nook/shared/errors.ts'

import { type Action, Permissions, type Role, Who } from '../src/who.ts'

const as = (role: Role, actor: string = role) => new Permissions(new Who(role, actor, null))

const denial = (work: () => void): EvError => {
  try {
    work()
  } catch (error) {
    return error as EvError
  }
  throw new Error('expected a denial')
}

describe('Who.fromEnv', () => {
  test('a process that Claude Code did not start is the owner', () => {
    expect(Who.fromEnv({})).toEqual(new Who('owner', 'owner', null))
  })

  test('CLAUDECODE set with no NOOK_ROLE is the lead', () => {
    expect(Who.fromEnv({ CLAUDECODE: '1', CLAUDE_SESSION_ID: 's-9' })).toEqual(new Who('lead', 'lead', 's-9'))
  })

  test('NOOK_ROLE, NOOK_ACTOR and NOOK_SESSION name the agent', () => {
    expect(Who.fromEnv({ CLAUDECODE: '1', NOOK_ROLE: 'builder', NOOK_ACTOR: 'bff-builder-01', NOOK_SESSION: 's-1' })).toEqual(new Who('builder', 'bff-builder-01', 's-1'))
  })

  test('a NOOK_ROLE that names no role is ignored', () => {
    expect(Who.fromEnv({ NOOK_ROLE: 'admin' }).role).toBe('owner')
  })
})

describe('Permissions', () => {
  const table: [Action, Role[]][] = [
    ['approve', ['owner']],
    ['accept', ['owner']],
    ['mode', ['owner']],
    ['proceed', ['lead']],
    ['move', ['owner', 'lead']],
    ['task import', ['owner', 'lead']],
    ['task retry', ['owner', 'lead']],
    ['task start', ['owner', 'lead', 'builder']],
    ['task done', ['owner', 'lead', 'builder']],
    ['task prove', ['owner', 'lead', 'builder', 'reader']],
    ['item verify', ['owner', 'lead', 'builder', 'reader']],
    ['item ac done', ['owner', 'lead', 'reader']],
    ['guess', ['owner', 'lead', 'builder']],
    ['note add', ['owner', 'lead', 'builder']],
  ]

  test('each action is open to the roles of section 8 and to no other', () => {
    for (const [action, roles] of table) {
      const open = (['owner', 'lead', 'builder', 'reader'] as Role[]).filter(role => as(role).can(action))
      expect([action, open]).toEqual([action, roles])
    }
  })

  test('a denied action exits 5 and names who can do it and the role of the caller', () => {
    const error = denial(() => as('lead').assert('approve'))
    expect(error.code).toBe(Exit.denied)
    expect(error.message).toBe('approve: only the owner can do this (you are lead)')
    expect(denial(() => as('reader').assert('move')).message).toBe('move: only the owner or the lead can do this (you are reader)')
  })

  test('a builder may not move the slice of another builder', () => {
    const error = denial(() => as('builder', 'web-builder-1').assertOwnSlice('bff-builder-1', 'T1'))
    expect(error.code).toBe(Exit.denied)
    expect(error.message).toBe('T1 is the slice of bff-builder-1 (you are web-builder-1): a builder works on its own slice only')
  })

  test('the lead may move any slice; a builder may move its own', () => {
    expect(() => as('lead').assertOwnSlice('bff-builder-1', 'T1')).not.toThrow()
    expect(() => as('builder', 'bff-builder-1').assertOwnSlice('bff-builder-1', 'T1')).not.toThrow()
  })
})
