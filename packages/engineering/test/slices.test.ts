import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { dependsCycle, parseTasks } from '../src/docs/tasks.ts'
import { addGuess, decideGuess, guesses } from '../src/model/guesses.ts'
import { moveItem } from '../src/model/moves.ts'
import { importTasks, moveSlice, readySlices, slices } from '../src/model/slices.ts'
import { BUILDER, itemAt, LEAD, makeHome, OWNER, READER, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const code = (work: () => unknown) => {
  try {
    work()
  } catch (error) {
    return (error as EvError).code
  }
  return 0
}

describe('tasks.md parser', () => {
  test('reads sections, fields in any case, lists with commas or spaces, and names the problems', () => {
    const parsed = parseTasks('# t\n\n## T1: the test\n\n- area: bff\n- depends: none\n- acs: 1, 2\n- size: s\n- done when: it passes\n- proof: none (a config change)\n\n## T2: the fix\n\nArea: web\nDepends: T1 T3\nacs: AC1\nsize: XL\n')
    expect(parsed.slices[0]).toMatchObject({ id: 'T1', title: 'the test', area: 'bff', depends: [], acs: [1, 2], size: 'S', doneWhen: 'it passes', proof: 'none (a config change)' })
    expect(parsed.slices[1]).toMatchObject({ id: 'T2', area: 'web', depends: ['T1', 'T3'], acs: [1], size: null })
    expect(parsed.problems).toEqual(['T2: size "XL" is not S, M or L', 'T2: depends names T3, which is not a slice'])
    expect(dependsCycle([{ id: 'T1', depends: ['T2'] }, { id: 'T2', depends: ['T1'] }])).toEqual(['T1', 'T2', 'T1'])
    expect(dependsCycle([{ id: 'T1', depends: [] }, { id: 'T2', depends: ['T1'] }])).toBeNull()
  })
})

describe('task import', () => {
  test('is idempotent by slice id: creates, updates todo, cancels removed, keeps started', () => {
    itemAt(t, 'planning')
    const lead = t.kit(LEAD)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }, { id: 'T2', depends: 'T1' }, { id: 'T3' }]))
    expect(importTasks(lead, 'SHOP-1')).toEqual({ created: ['T1', 'T2', 'T3'], updated: [], cancelled: [], kept: [] })
    expect(importTasks(lead, 'SHOP-1')).toEqual({ created: [], updated: [], cancelled: [], kept: [] })
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', title: 'renamed' }, { id: 'T2', depends: 'T1' }]))
    expect(importTasks(lead, 'SHOP-1')).toEqual({ created: [], updated: ['T1'], cancelled: ['T3'], kept: [] })
    expect(slices(lead, 'SHOP-1').find(s => s.id === 'T3')?.state).toBe('cancelled')
    // a started slice stays as it is, even when the file drops it
    lead.db.run("UPDATE slice SET state = 'running', assignee = 'lead' WHERE item = 'SHOP-1' AND id = 'T2'")
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', title: 'renamed' }, { id: 'T3' }]))
    const report = importTasks(lead, 'SHOP-1')
    expect(report.updated).toEqual(['T3'])
    expect(report.kept).toEqual(['T2 (running, not in tasks.md)'])
    expect(slices(lead, 'SHOP-1').find(s => s.id === 'T2')?.state).toBe('running')
  })

  test('refuses a file with problems, and refuses from ready on with exit 3', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', area: '' }]))
    expect(code(() => importTasks(t.kit(LEAD), 'SHOP-1'))).toBe(Exit.refused)
    expect(code(() => importTasks(t.kit(BUILDER), 'SHOP-1'))).toBe(Exit.denied)
    t.cleanup()
    t = makeHome()
    itemAt(t, 'ready')
    expect(code(() => importTasks(t.kit(LEAD), 'SHOP-1'))).toBe(Exit.refused)
  })
})

describe('task moves', () => {
  test('start needs cooking and done dependencies; the states follow the machine', () => {
    itemAt(t, 'planning')
    const lead = t.kit(LEAD)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }, { id: 'T2', depends: 'T1' }]))
    importTasks(lead, 'SHOP-1')
    expect(code(() => moveSlice(lead, 'start', 'SHOP-1', 'T1'))).toBe(Exit.refused)
    t.cleanup()
    t = makeHome()
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2', depends: 'T1' }]))
    const k = t.kit(LEAD)
    expect(readySlices(k, 'SHOP-1').map(s => s.id)).toEqual(['T1'])
    expect(code(() => moveSlice(k, 'start', 'SHOP-1', 'T2'))).toBe(Exit.refused)
    moveSlice(k, 'start', 'SHOP-1', 'T1')
    expect(code(() => moveSlice(k, 'wait', 'SHOP-1', 'T1'))).toBe(Exit.usage)
    moveSlice(k, 'wait', 'SHOP-1', 'T1', { reason: 'needs the schema' })
    moveSlice(k, 'resume', 'SHOP-1', 'T1')
    moveSlice(k, 'fail', 'SHOP-1', 'T1', { reason: 'three tries' })
    expect(code(() => moveSlice(k, 'done', 'SHOP-1', 'T1'))).toBe(Exit.refused)
    moveSlice(k, 'retry', 'SHOP-1', 'T1')
    expect(slices(k, 'SHOP-1')[0]).toMatchObject({ state: 'todo', assignee: null })
    moveSlice(k, 'start', 'SHOP-1', 'T1')
    const done = moveSlice(k, 'done', 'SHOP-1', 'T1', { files: ['src/a.ts', 'tests/a.test.sh'] })
    expect(done.files).toEqual(['src/a.ts', 'tests/a.test.sh'])
    expect(readySlices(k, 'SHOP-1').map(s => s.id)).toEqual(['T2'])
    moveSlice(k, 'reopen', 'SHOP-1', 'T1', { reason: 'a bug' })
    expect(slices(k, 'SHOP-1')[0]!.state).toBe('running')
    moveSlice(k, 'cancel', 'SHOP-1', 'T2', { reason: 'not needed' })
    const version = slices(k, 'SHOP-1')[0]!.version
    expect(code(() => moveSlice(k, 'done', 'SHOP-1', 'T1', { ifVersion: String(version - 1) }))).toBe(Exit.conflict)
  })

  test('a builder works on its own slice only; a reader on none; retry and cancel are the lead\'s', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const builder = t.kit(BUILDER)
    const other = t.kit({ role: 'builder', actor: 'frontend-builder-ff00', session: null })
    moveSlice(builder, 'start', 'SHOP-1', 'T1')
    expect(slices(builder, 'SHOP-1')[0]!.assignee).toBe('backend-builder-ab12')
    expect(code(() => moveSlice(other, 'done', 'SHOP-1', 'T1', { files: ['a'] }))).toBe(Exit.denied)
    expect(code(() => moveSlice(other, 'wait', 'SHOP-1', 'T1', { reason: 'x' }))).toBe(Exit.denied)
    expect(code(() => moveSlice(t.kit(READER), 'start', 'SHOP-1', 'T2'))).toBe(Exit.denied)
    moveSlice(builder, 'fail', 'SHOP-1', 'T1', { reason: 'cannot' })
    expect(code(() => moveSlice(builder, 'retry', 'SHOP-1', 'T1'))).toBe(Exit.denied)
    expect(code(() => moveSlice(builder, 'cancel', 'SHOP-1', 'T2', { reason: 'x' }))).toBe(Exit.denied)
    moveSlice(t.kit(LEAD), 'retry', 'SHOP-1', 'T1')
    // the lead and the owner work on any slice
    moveSlice(builder, 'start', 'SHOP-1', 'T1')
    moveSlice(t.kit(OWNER), 'done', 'SHOP-1', 'T1', { files: ['a'] })
  })
})

describe('E-23 guesses', () => {
  test('a guess is recorded with its impact and slices; a flip resets only those slices', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }]))
    const lead = t.kit(LEAD)
    const builder = t.kit(BUILDER)
    for (const id of ['T1', 'T2', 'T3']) {
      moveSlice(lead, 'start', 'SHOP-1', id)
      moveSlice(lead, 'done', 'SHOP-1', id, { files: [`${id}.ts`] })
    }
    const guess = addGuess(builder, 'SHOP-1', { question: 'which time zone?', took: 'UTC', other: 'local', impact: 'med', slices: ['T1', 'T2'] })
    expect(guess).toMatchObject({ id: 'G1', status: 'open', slices: ['T1', 'T2'], by: 'backend-builder-ab12' })
    expect(code(() => addGuess(builder, 'SHOP-1', { question: 'q', took: 'a', other: 'b', impact: 'huge', slices: [] }))).toBe(Exit.usage)
    expect(code(() => decideGuess(builder, 'SHOP-1', 'G1', 'flip'))).toBe(Exit.denied)
    const flipped = decideGuess(lead, 'SHOP-1', 'G1', 'flip', 'local time')
    expect(flipped.reset).toEqual(['T1', 'T2'])
    expect(slices(lead, 'SHOP-1').map(s => s.state)).toEqual(['todo', 'todo', 'done'])
    expect(guesses(lead, 'SHOP-1')[0]).toMatchObject({ status: 'flipped', answer: 'local time' })
    expect(guesses(lead, undefined, true)).toEqual([])
    const second = addGuess(lead, 'SHOP-1', { question: 'retry count?', took: '3', other: '5', impact: 'low', slices: [] })
    expect(decideGuess(lead, 'SHOP-1', second.id, 'accept').status).toBe('accepted')
  })
})

describe('moves and slices together', () => {
  test('a slice cannot start in checking', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    expect(code(() => moveItem(lead, 'submit', 'SHOP-1'))).toBe(Exit.refused)
  })
})
