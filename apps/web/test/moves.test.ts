import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { itemAt, LEAD, makeHome, OWNER, PLAN, TASKS, type TestHome, writeDoc } from '../../../packages/engineering/test/helpers.ts'
import { moveArgs, nookCommand, runMove } from '@/lib/moves.ts'

describe('moveArgs', () => {
  test('gives the words of each owner move, with --via viewer before the item', () => {
    expect(moveArgs({ kind: 'gate', item: 'SHOP-42', move: 'approve' })).toEqual(['eng', 'item', 'approve', '--via', 'viewer', '--', 'SHOP-42'])
    expect(moveArgs({ kind: 'mode', item: 'SHOP-42', mode: 'yolo' })).toEqual(['eng', 'item', 'mode', '--via', 'viewer', '--', 'SHOP-42', 'yolo'])
    expect(moveArgs({ kind: 'answer', item: 'SHOP-42', question: 'q2', answer: ' -the same card ' })).toEqual(['eng', 'answer', '--via', 'viewer', '--', 'SHOP-42', 'Q2', '-the same card'])
    expect(moveArgs({ kind: 'guess', item: 'SHOP-42', guess: 'G5', decision: 'flip' })).toEqual(['eng', 'guess', 'flip', '--via', 'viewer', '--', 'SHOP-42', 'G5'])
  })

  test('refuses a form that is no owner move, before any command runs', () => {
    expect(moveArgs({ kind: 'gate', item: 'SHOP-42', move: 'cancel' })).toEqual({ refused: 'cancel is no move of the owner' })
    expect(moveArgs({ kind: 'gate', item: '--json', move: 'approve' })).toEqual({ refused: '--json is no item id' })
    expect(moveArgs({ kind: 'answer', item: 'SHOP-42', question: 'Q2', answer: '  ' })).toEqual({ refused: 'type the answer first' })
    expect(moveArgs({ kind: 'task', item: 'SHOP-42' })).toEqual({ refused: 'task is no owner move' })
  })
})

describe('nookCommand', () => {
  test('runs the nook that started the web app, else nook on the path', () => {
    expect(nookCommand({ NOOK_CLI: '["/bin/bun","/nook/apps/nook/src/main.ts"]' })).toEqual(['/bin/bun', '/nook/apps/nook/src/main.ts'])
    expect(nookCommand({})).toEqual(['nook'])
  })

  test('takes a broken NOOK_CLI as none, so the move still runs and is never a server error', () => {
    expect(nookCommand({ NOOK_CLI: 'not json' })).toEqual(['nook'])
    expect(nookCommand({ NOOK_CLI: '{"a":1}' })).toEqual(['nook'])
  })
})

describe('runMove', () => {
  let t: TestHome
  const env = (): NodeJS.ProcessEnv => {
    const base: NodeJS.ProcessEnv = { ...process.env, NOOK_CLI: JSON.stringify([process.execPath, join(import.meta.dir, '..', '..', 'nook', 'src', 'main.ts')]) }
    delete base.CLAUDECODE
    delete base.NOOK_ROLE
    return base
  }
  beforeEach(() => {
    t = makeHome()
  })
  afterEach(() => t.cleanup())

  test('an approve from the page moves the item, and the ledger records owner (viewer)', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    t.eng(LEAD).importTasks('SHOP-1')
    expect(runMove({ kind: 'gate', item: 'SHOP-1', move: 'approve' }, t.root, env()).ok).toBe(true)
    expect(t.eng(OWNER).item('SHOP-1').state).toBe('ready')
    expect(t.eng(OWNER).stores.events.last('SHOP-1', 'approve')?.actor).toBe('owner (viewer)')
  })

  test('a refused move gives the gaps of the guard and their fixes, word for word', () => {
    itemAt(t, 'planning')
    const result = runMove({ kind: 'gate', item: 'SHOP-1', move: 'approve' }, t.root, env())
    expect(result.ok).toBe(false)
    expect(result.lines.join('\n')).toContain('plan.md')
    expect(t.eng(OWNER).item('SHOP-1').state).toBe('planning')
  })

  test('an answer from the page answers the question as the owner', () => {
    itemAt(t, 'cooking')
    const question = t.eng(LEAD).ask('SHOP-1', 'Must a refund go to the same card?', true)
    expect(runMove({ kind: 'answer', item: 'SHOP-1', question: question.id, answer: 'the same card' }, t.root, env()).ok).toBe(true)
    expect(t.eng(OWNER).stores.questions.find('SHOP-1', question.id)).toMatchObject({ status: 'answered', answer: 'the same card', answered_by: 'owner (viewer)' })
  })

  test('an answer that starts with a dash is the answer, not a flag', () => {
    itemAt(t, 'cooking')
    const question = t.eng(LEAD).ask('SHOP-1', 'How many retries?', false)
    expect(runMove({ kind: 'answer', item: 'SHOP-1', question: question.id, answer: '-1 means no limit' }, t.root, env()).ok).toBe(true)
    expect(t.eng(OWNER).stores.questions.find('SHOP-1', question.id)?.answer).toBe('-1 means no limit')
  })

  test('a move whose program does not start says that it did not finish', () => {
    itemAt(t, 'planning')
    expect(runMove({ kind: 'gate', item: 'SHOP-1', move: 'approve' }, t.root, { ...env(), NOOK_CLI: '["/no/such/nook"]' })).toEqual({ ok: false, lines: [expect.stringMatching(/ENOENT|did not finish/)] })
  })
})
