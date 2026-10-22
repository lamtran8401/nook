import type { ItemMove } from '@nook/engineering/read/reader.ts'
import type { Criterion } from '@nook/engineering/stores/criteria.ts'
import type { Item } from '@nook/engineering/stores/items.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'

import { FLOW } from '@/lib/board.ts'

export type CriterionState = 'met' | 'planned' | 'building' | 'blocked' | 'waits'
export const CRITERION_STATE_TONE: Record<CriterionState, string> = { met: 'success', planned: 'neutral', building: 'primary', blocked: 'danger', waits: 'neutral' }

const BUILT: Item['state'][] = ['cooking', 'review']

/**
 * The state of a criterion: met with its evidence, or once the item is done, since the accept counts each one met;
 * before the build, planned; in the build, the slices that prove it tell: one that waits or fails blocks it, one at
 * work or done builds it, and none started yet waits.
 */
export function criterionState(criterion: Pick<Criterion, 'n' | 'done'>, slices: Slice[], state: Item['state'], blockedFrom: Item['state'] | null = null): CriterionState {
  const step = state === 'blocked' ? blockedFrom : state
  if (criterion.done || step === 'done') return 'met'
  if (!step || !BUILT.includes(step)) return 'planned'
  const proving = slices.filter(slice => slice.acs.includes(criterion.n) && slice.state !== 'cancelled')
  if (proving.some(slice => slice.state === 'failed' || slice.state === 'waiting')) return 'blocked'
  if (proving.some(slice => slice.state === 'running' || slice.state === 'done')) return 'building'
  return 'waits'
}

export type StepTime = { step: string; ms: number }

/** The time that the item spent in each step of the flow, each visit added up; the step it is in counts up to now, and done counts nothing. */
export function timeInSteps(moves: ItemMove[], now: Date): StepTime[] {
  const spent = new Map<string, number>()
  moves.forEach((move, i) => {
    if (move.to === 'done') return
    const end = moves[i + 1]?.at ? Date.parse(moves[i + 1]!.at) : now.getTime()
    spent.set(move.to, (spent.get(move.to) ?? 0) + end - Date.parse(move.at))
  })
  return [...FLOW, 'blocked'].flatMap(step => (spent.has(step) ? [{ step, ms: spent.get(step)! }] : []))
}
