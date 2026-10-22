import { describe, expect, test } from 'bun:test'

import type { ItemMove } from '@nook/engineering/read/reader.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'

import { criterionState, timeInSteps } from '@/lib/progress.ts'

const slice = (id: string, state: Slice['state'], acs: number[]) => ({ id, state, acs }) as Slice

describe('the state of a criterion', () => {
  const slices = [slice('T1', 'done', [1]), slice('T2', 'running', [1, 2]), slice('T3', 'waiting', [3]), slice('T4', 'todo', [4]), slice('T5', 'cancelled', [5])]

  test('a criterion with its evidence is met', () => {
    expect(criterionState({ n: 1, done: true }, slices, 'cooking')).toBe('met')
  })

  test('before the build, each open criterion is planned', () => {
    expect(criterionState({ n: 3, done: false }, slices, 'planning')).toBe('planned')
  })

  test('in the build, the slices that prove it give the state: one at work builds, one that waits or fails blocks', () => {
    expect([1, 2, 3, 4, 5].map(n => criterionState({ n, done: false }, slices, 'cooking'))).toEqual(['building', 'building', 'blocked', 'waits', 'waits'])
  })

  test('a done item counts each criterion as met, as its accept does', () => {
    expect(criterionState({ n: 4, done: false }, slices, 'done')).toBe('met')
  })

  test('a blocked item in its build reads as in the build', () => {
    expect(criterionState({ n: 2, done: false }, slices, 'blocked', 'cooking')).toBe('building')
  })
})

describe('the time in each step', () => {
  const moves: ItemMove[] = [
    { move: 'new', to: 'backlog', at: '2026-10-14T09:00:00Z' },
    { move: 'start', to: 'framing', at: '2026-10-14T12:00:00Z' },
    { move: 'agree', to: 'planning', at: '2026-10-14T13:00:00Z' },
    { move: 'reframe', to: 'framing', at: '2026-10-14T14:00:00Z' },
    { move: 'agree', to: 'planning', at: '2026-10-14T14:30:00Z' },
  ]

  test('adds the time of each visit to a step, in the order of the flow, and counts the last step up to now', () => {
    expect(timeInSteps(moves, new Date('2026-10-14T16:30:00Z'))).toEqual([
      { step: 'backlog', ms: 3 * 3_600_000 },
      { step: 'framing', ms: 1.5 * 3_600_000 },
      { step: 'planning', ms: 3 * 3_600_000 },
    ])
  })

  test('a done item stops counting at its accept', () => {
    const done: ItemMove[] = [...moves, { move: 'accept', to: 'done', at: '2026-10-14T15:30:00Z' }]
    expect(timeInSteps(done, new Date('2026-10-20T00:00:00Z')).map(part => part.step)).toEqual(['backlog', 'framing', 'planning'])
  })
})
