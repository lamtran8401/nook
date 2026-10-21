import { describe, expect, test } from 'bun:test'

import { confirmOf } from '@/lib/confirm.ts'

describe('confirmOf', () => {
  test('a gate names the move, the item and what it does', () => {
    expect(confirmOf({ kind: 'gate', item: 'SHOP-43', move: 'approve' }, {})).toEqual({
      title: 'Approve SHOP-43?',
      body: 'The spec, the plan and the slices freeze, and the build can start. It runs the same guards as /gate approve SHOP-43.',
      action: 'Approve',
    })
    expect(confirmOf({ kind: 'gate', item: 'SHOP-44', move: 'accept' }, {})).toMatchObject({ title: 'Accept SHOP-44?', action: 'Accept' })
  })

  test('a send back quotes the reason and says where the item goes', () => {
    expect(confirmOf({ kind: 'back', item: 'SHOP-44' }, { reason: ' AC2 has no test ' })).toEqual({
      title: 'Send SHOP-44 back?',
      body: 'The item goes back to the build, and the lead gets your reason: "AC2 has no test".',
      action: 'Send back',
    })
  })

  test('a mode names the mode that the button picks', () => {
    expect(confirmOf({ kind: 'mode', item: 'SHOP-42' }, { mode: 'yolo' })).toEqual({ title: 'Switch SHOP-42 to yolo?', body: 'The lead runs the stages alone, with no stop at the skill of each stage.', action: 'Switch to yolo' })
    expect(confirmOf({ kind: 'mode', item: 'SHOP-42' }, { mode: 'normal' })).toMatchObject({ title: 'Switch SHOP-42 to normal?', body: 'Each stage waits for its skill again.' })
  })

  test('an answer quotes the words that go to the lead', () => {
    expect(confirmOf({ kind: 'answer', item: 'SHOP-42', question: 'Q3' }, { answer: '  the same card ' })).toEqual({ title: 'Send the answer to Q3?', body: '"the same card" goes to the lead as your answer to Q3 of SHOP-42.', action: 'Send' })
  })

  test('a guess names what keeping or flipping it does to its slices', () => {
    expect(confirmOf({ kind: 'guess', item: 'SHOP-42', guess: 'G5' }, { decision: 'accept' })).toEqual({ title: 'Keep G5?', body: 'The guess of the lead stands, and the slices that it shaped go on.', action: 'Keep' })
    expect(confirmOf({ kind: 'guess', item: 'SHOP-42', guess: 'G5' }, { decision: 'flip' })).toEqual({ title: 'Flip G5?', body: 'The other way wins, and the slices that the guess shaped go back to todo.', action: 'Flip' })
  })
})
