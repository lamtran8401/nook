import { match } from 'ts-pattern'

import { usage } from '@nook/shared/errors.ts'

import type { WorkDoc } from './documents/work-folder.ts'
import type { Action } from './who.ts'

/** The states and moves of an item and of a slice (docs/engineering.md sections 4 and 5). */

export const STATES = [
  'backlog',
  'framing',
  'planning',
  'ready',
  'cooking',
  'review',
  'done',
  'blocked',
  'cancelled',
] as const
export type State = (typeof STATES)[number]
export const OPEN_STATES: State[] = [
  'backlog',
  'framing',
  'planning',
  'ready',
  'cooking',
  'review',
  'blocked',
]
/** From `ready` on, the slices and the criteria are frozen. */
export const FROZEN_STATES: State[] = ['ready', 'cooking', 'review', 'done']

export const isOpen = (state: State) => OPEN_STATES.includes(state)
export const isFrozen = (state: State) => FROZEN_STATES.includes(state)

export const MOVE_NAMES = [
  'start',
  'agree',
  'approve',
  'proceed',
  'begin',
  'submit',
  'accept',
  'reject',
  'replan',
  'reframe',
  'reopen',
  'block',
  'unblock',
  'cancel',
  'restore',
] as const
export type MoveName = (typeof MOVE_NAMES)[number]

export type Move = {
  from: State[]
  /** `blocked_from`: the state that the item had before the block. */
  to: State | 'blocked_from'
  action: Action
  reason?: boolean
  /** A move back clears the approval and sets the evidence watermark. */
  back?: boolean
  /** Copies kind, size, areas and the criteria from spec.md into the ledger. */
  copiesSpec?: boolean
  /** Stores the fingerprints of the three documents. */
  approves?: boolean
  /** Sets the mode back to normal: an auto run ends at the accept, and only the owner starts the next one. */
  endsAuto?: boolean
  /** Brings an archived ticket folder back to the backlog: the item is open again and its stages read the ticket. */
  unarchives?: boolean
  /** The documents that the move writes from their templates. */
  scaffolds?: WorkDoc[]
}

const OPEN_NOT_BLOCKED = OPEN_STATES.filter(s => s !== 'blocked')

export const MOVES: Record<MoveName, Move> = {
  start: { from: ['backlog'], to: 'framing', action: 'move', scaffolds: ['spec.md'] },
  agree: {
    from: ['framing'],
    to: 'planning',
    action: 'move',
    copiesSpec: true,
    scaffolds: ['plan.md', 'tasks.md'],
  },
  approve: { from: ['planning'], to: 'ready', action: 'approve', copiesSpec: true, approves: true },
  proceed: { from: ['planning'], to: 'ready', action: 'proceed', copiesSpec: true, approves: true },
  begin: { from: ['ready'], to: 'cooking', action: 'move' },
  submit: { from: ['cooking'], to: 'review', action: 'move' },
  accept: { from: ['review'], to: 'done', action: 'accept' },
  reject: { from: ['review'], to: 'cooking', action: 'move', reason: true, back: true },
  replan: {
    from: ['ready', 'cooking', 'review'],
    to: 'planning',
    action: 'move',
    reason: true,
    back: true,
  },
  reframe: {
    from: ['planning', 'ready', 'cooking', 'review'],
    to: 'framing',
    action: 'move',
    reason: true,
    back: true,
  },
  reopen: { from: ['done'], to: 'cooking', action: 'move', reason: true, back: true, endsAuto: true, unarchives: true },
  block: { from: OPEN_NOT_BLOCKED, to: 'blocked', action: 'move', reason: true },
  unblock: { from: ['blocked'], to: 'blocked_from', action: 'move' },
  cancel: { from: OPEN_STATES, to: 'cancelled', action: 'move', reason: true },
  restore: { from: ['cancelled'], to: 'backlog', action: 'move', back: true, unarchives: true },
}

export function moveNamed(name: string): MoveName {
  const found = MOVE_NAMES.find(m => m === name)
  if (!found) throw usage(`no move is named ${name}`, `moves: ${MOVE_NAMES.join(', ')}`)
  return found
}

type Position = { state: State; blocked_from: State | null }

export function afterMove(name: MoveName, item: Position): Position {
  const move = MOVES[name]
  const state = move.to === 'blocked_from' ? (item.blocked_from ?? 'backlog') : move.to
  const blocked_from = match(name)
    .with('block', () => item.state)
    .with('unblock', () => null)
    .otherwise(() => item.blocked_from)
  return { state, blocked_from }
}

/** The forward move from a state: the one whose gaps `item check` and `next` show. */
export function forwardMove(state: State): MoveName | undefined {
  return match(state)
    .with('backlog', () => 'start' as const)
    .with('framing', () => 'agree' as const)
    .with('planning', () => 'approve' as const)
    .with('ready', () => 'begin' as const)
    .with('cooking', () => 'submit' as const)
    .with('review', () => 'accept' as const)
    .with('done', 'blocked', 'cancelled', () => undefined)
    .exhaustive()
}

export const SLICE_STATES = ['todo', 'running', 'waiting', 'done', 'failed', 'cancelled'] as const
export type SliceState = (typeof SLICE_STATES)[number]

export const SLICE_MOVE_NAMES = [
  'start',
  'done',
  'wait',
  'resume',
  'fail',
  'retry',
  'reopen',
  'cancel',
] as const
export type SliceMoveName = (typeof SLICE_MOVE_NAMES)[number]

/** `own`: a builder makes the move on its own slice only. */
export type SliceMove = {
  action: Action
  from: SliceState[]
  to: SliceState
  reason?: boolean
  own?: boolean
}

export const SLICE_MOVES: Record<SliceMoveName, SliceMove> = {
  start: { action: 'task start', from: ['todo'], to: 'running', own: true },
  done: { action: 'task done', from: ['running'], to: 'done', own: true },
  wait: { action: 'task wait', from: ['running'], to: 'waiting', reason: true, own: true },
  resume: { action: 'task resume', from: ['waiting'], to: 'running', own: true },
  fail: { action: 'task fail', from: ['running', 'waiting'], to: 'failed', reason: true, own: true },
  retry: { action: 'task retry', from: ['failed'], to: 'todo' },
  reopen: { action: 'task reopen', from: ['done'], to: 'running', reason: true },
  cancel: {
    action: 'task cancel',
    from: ['todo', 'running', 'waiting', 'failed'],
    to: 'cancelled',
    reason: true,
  },
}

export function sliceMoveNamed(name: string): SliceMoveName {
  const found = SLICE_MOVE_NAMES.find(m => m === name)
  if (!found) throw usage(`no task move is named ${name}`, `moves: ${SLICE_MOVE_NAMES.join(', ')}`)
  return found
}

/** Who holds a slice after a move: a slice that runs gets an owner, a slice back in todo has none. */
export function assigneeAfter(name: SliceMoveName, assignee: string | null, actor: string): string | null {
  return match(SLICE_MOVES[name].to)
    .with('running', () => (name === 'start' || !assignee ? actor : assignee))
    .with('todo', () => null)
    .with('waiting', 'done', 'failed', 'cancelled', () => assignee)
    .exhaustive()
}
