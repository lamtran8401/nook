import { describe, expect, test } from 'bun:test'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { afterMove, assigneeAfter, forwardMove, MOVES, moveNamed, SLICE_MOVES, sliceMoveNamed, type State } from '../src/machine.ts'

describe('the item machine', () => {
  test('the forward path runs backlog to done through the six forward moves', () => {
    expect(['backlog', 'framing', 'planning', 'ready', 'cooking', 'review'].map(s => forwardMove(s as State))).toEqual(['start', 'agree', 'approve', 'begin', 'submit', 'accept'])
  })

  test('done, blocked and cancelled have no forward move', () => {
    expect([forwardMove('done'), forwardMove('blocked'), forwardMove('cancelled')]).toEqual([undefined, undefined, undefined])
  })

  test('the moves back are reject, replan, reframe, reopen and restore', () => {
    expect(Object.entries(MOVES).filter(([, m]) => m.back).map(([name]) => name)).toEqual(['reject', 'replan', 'reframe', 'reopen', 'restore'])
  })

  test('the moves that need a reason are the moves back but restore, plus block and cancel', () => {
    expect(Object.entries(MOVES).filter(([, m]) => m.reason).map(([name]) => name)).toEqual(['reject', 'replan', 'reframe', 'reopen', 'block', 'cancel'])
  })

  test('approve and accept are the owner moves; proceed is the lead move', () => {
    expect([MOVES.approve.action, MOVES.accept.action, MOVES.proceed.action, MOVES.begin.action]).toEqual(['approve', 'accept', 'proceed', 'move'])
  })

  test('block keeps the state before, and unblock goes back to it', () => {
    const blocked = afterMove('block', { state: 'cooking', blocked_from: null })
    expect(blocked).toEqual({ state: 'blocked', blocked_from: 'cooking' })
    expect(afterMove('unblock', blocked)).toEqual({ state: 'cooking', blocked_from: null })
  })

  test('unblock with no state before goes to backlog', () => {
    expect(afterMove('unblock', { state: 'blocked', blocked_from: null })).toEqual({ state: 'backlog', blocked_from: null })
  })

  test('cancel is open to every open state, block to every open state but blocked', () => {
    expect(MOVES.cancel.from).toEqual(['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'blocked'])
    expect(MOVES.block.from).toEqual(['backlog', 'framing', 'planning', 'ready', 'cooking', 'review'])
  })

  test('an unknown move name exits 2 and lists the moves in order', () => {
    let error: EvError | undefined
    try {
      moveNamed('frob')
    } catch (e) {
      error = e as EvError
    }
    expect(error?.code).toBe(Exit.usage)
    expect(error?.message).toBe('no move is named frob')
    expect(error?.fix).toBe('moves: start, agree, approve, proceed, begin, submit, accept, reject, replan, reframe, reopen, block, unblock, cancel, restore')
  })
})

describe('the slice machine', () => {
  test('a slice runs from todo, waits and resumes, fails from running or waiting, and retries to todo', () => {
    expect(SLICE_MOVES.start).toMatchObject({ from: ['todo'], to: 'running' })
    expect(SLICE_MOVES.resume).toMatchObject({ from: ['waiting'], to: 'running' })
    expect(SLICE_MOVES.fail).toMatchObject({ from: ['running', 'waiting'], to: 'failed' })
    expect(SLICE_MOVES.retry).toMatchObject({ from: ['failed'], to: 'todo' })
    expect(SLICE_MOVES.reopen).toMatchObject({ from: ['done'], to: 'running' })
  })

  test('only the builder moves are limited to the own slice', () => {
    expect(Object.entries(SLICE_MOVES).filter(([, m]) => m.own).map(([name]) => name)).toEqual(['start', 'done', 'wait', 'resume', 'fail'])
  })

  test('start gives the slice to the caller; resume keeps the holder; retry clears it', () => {
    expect(assigneeAfter('start', 'other', 'me')).toBe('me')
    expect(assigneeAfter('resume', 'other', 'me')).toBe('other')
    expect(assigneeAfter('reopen', null, 'me')).toBe('me')
    expect(assigneeAfter('retry', 'other', 'me')).toBeNull()
    expect(assigneeAfter('done', 'other', 'me')).toBe('other')
  })

  test('an unknown task move exits 2', () => {
    expect(() => sliceMoveNamed('jump')).toThrow('no task move is named jump')
  })
})
