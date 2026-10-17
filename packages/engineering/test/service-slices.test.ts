import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { EvError, Exit } from '@nook/shared/errors.ts'

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

describe('Engineering.importTasks', () => {
  test('is idempotent by slice id: creates, updates todo, cancels removed, keeps started', () => {
    itemAt(t, 'planning')
    const lead = t.eng(LEAD)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }, { id: 'T2', depends: 'T1' }, { id: 'T3' }]))
    expect(lead.importTasks('SHOP-1')).toEqual({ created: ['T1', 'T2', 'T3'], updated: [], cancelled: [], kept: [] })
    expect(lead.importTasks('SHOP-1')).toEqual({ created: [], updated: [], cancelled: [], kept: [] })
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', title: 'renamed' }, { id: 'T2', depends: 'T1' }]))
    expect(lead.importTasks('SHOP-1')).toEqual({ created: [], updated: ['T1'], cancelled: ['T3'], kept: [] })
    expect(lead.stores.slices.list('SHOP-1').find(s => s.id === 'T3')?.state).toBe('cancelled')
    // a started slice stays as it is, even when the file drops it
    lead.ledger.run("UPDATE slice SET state = 'running', assignee = 'lead' WHERE item = 'SHOP-1' AND id = 'T2'")
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', title: 'renamed' }, { id: 'T3' }]))
    const report = lead.importTasks('SHOP-1')
    expect(report.updated).toEqual(['T3'])
    expect(report.kept).toEqual(['T2 (running, not in tasks.md)'])
    expect(lead.stores.slices.list('SHOP-1').find(s => s.id === 'T2')?.state).toBe('running')
  })

  test('a done slice takes a new mapping to the criteria and keeps its work; a new area is not taken', () => {
    itemAt(t, 'planning')
    const lead = t.eng(LEAD)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', acs: '1, 2, 3' }]))
    lead.importTasks('SHOP-1')
    lead.ledger.run("UPDATE slice SET state = 'done', assignee = 'lead', proof = 'proven' WHERE item = 'SHOP-1' AND id = 'T1'")
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', acs: '1', title: 'the export date, renumbered' }]))
    expect(lead.importTasks('SHOP-1')).toEqual({ created: [], updated: ['T1'], cancelled: [], kept: [] })
    const t1 = lead.stores.slices.list('SHOP-1').find(s => s.id === 'T1')!
    expect([t1.state, t1.proof, t1.acs, t1.title]).toEqual(['done', 'proven', [1], 'the export date, renumbered'])
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', acs: '1', title: 'the export date, renumbered', area: 'web' }]))
    expect(lead.importTasks('SHOP-1').kept).toEqual(['T1 (done)'])
    expect(lead.stores.slices.list('SHOP-1').find(s => s.id === 'T1')!.area).toBe('bff')
  })

  test('a proof line added to a todo slice reaches the ledger at the next import', () => {
    itemAt(t, 'planning')
    const lead = t.eng(LEAD)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    lead.importTasks('SHOP-1')
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', proof: 'none (a test-only slice)' }]))
    expect(lead.importTasks('SHOP-1').updated).toEqual(['T1'])
    const t1 = lead.stores.slices.list('SHOP-1').find(s => s.id === 'T1')!
    expect([t1.proof, t1.proof_note]).toEqual(['skipped', 'none (a test-only slice)'])
  })

  test('refuses a file with problems, and refuses from ready on with exit 3', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', area: '' }]))
    expect(code(() => t.eng(LEAD).importTasks('SHOP-1'))).toBe(Exit.refused)
    expect(code(() => t.eng(BUILDER).importTasks('SHOP-1'))).toBe(Exit.denied)
    t.cleanup()
    t = makeHome()
    itemAt(t, 'ready')
    expect(code(() => t.eng(LEAD).importTasks('SHOP-1'))).toBe(Exit.refused)
  })
})

describe('Engineering.moveSlice', () => {
  test('start needs cooking and done dependencies; the states follow the machine', () => {
    itemAt(t, 'planning')
    const lead = t.eng(LEAD)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }, { id: 'T2', depends: 'T1' }]))
    lead.importTasks('SHOP-1')
    expect(code(() => lead.moveSlice('start', 'SHOP-1', 'T1'))).toBe(Exit.refused)
    t.cleanup()
    t = makeHome()
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2', depends: 'T1' }]))
    const k = t.eng(LEAD)
    expect(k.stores.slices.ready('SHOP-1').map(s => s.id)).toEqual(['T1'])
    expect(code(() => k.moveSlice('start', 'SHOP-1', 'T2'))).toBe(Exit.refused)
    k.moveSlice('start', 'SHOP-1', 'T1')
    expect(code(() => k.moveSlice('wait', 'SHOP-1', 'T1'))).toBe(Exit.usage)
    k.moveSlice('wait', 'SHOP-1', 'T1', { reason: 'needs the schema' })
    k.moveSlice('resume', 'SHOP-1', 'T1')
    k.moveSlice('fail', 'SHOP-1', 'T1', { reason: 'three tries' })
    expect(code(() => k.moveSlice('done', 'SHOP-1', 'T1'))).toBe(Exit.refused)
    k.moveSlice('retry', 'SHOP-1', 'T1')
    expect(k.stores.slices.list('SHOP-1')[0]).toMatchObject({ state: 'todo', assignee: null })
    k.moveSlice('start', 'SHOP-1', 'T1')
    const done = k.moveSlice('done', 'SHOP-1', 'T1', { files: ['src/a.ts', 'tests/a.test.sh'] })
    expect(done.files).toEqual(['src/a.ts', 'tests/a.test.sh'])
    expect(k.stores.slices.ready('SHOP-1').map(s => s.id)).toEqual(['T2'])
    k.moveSlice('reopen', 'SHOP-1', 'T1', { reason: 'a bug' })
    expect(k.stores.slices.list('SHOP-1')[0]!.state).toBe('running')
    k.moveSlice('cancel', 'SHOP-1', 'T2', { reason: 'not needed' })
    const version = k.stores.slices.list('SHOP-1')[0]!.version
    expect(code(() => k.moveSlice('done', 'SHOP-1', 'T1', { ifVersion: String(version - 1) }))).toBe(Exit.conflict)
  })

  test('a builder works on its own slice only; a reader on none; retry and cancel are the lead\'s', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const builder = t.eng(BUILDER)
    const other = t.eng({ role: 'builder', actor: 'frontend-builder-ff00', session: null })
    builder.moveSlice('start', 'SHOP-1', 'T1')
    expect(builder.stores.slices.list('SHOP-1')[0]!.assignee).toBe('backend-builder-ab12')
    expect(code(() => other.moveSlice('done', 'SHOP-1', 'T1', { files: ['a'] }))).toBe(Exit.denied)
    expect(code(() => other.moveSlice('wait', 'SHOP-1', 'T1', { reason: 'x' }))).toBe(Exit.denied)
    expect(code(() => t.eng(READER).moveSlice('start', 'SHOP-1', 'T2'))).toBe(Exit.denied)
    builder.moveSlice('fail', 'SHOP-1', 'T1', { reason: 'cannot' })
    expect(code(() => builder.moveSlice('retry', 'SHOP-1', 'T1'))).toBe(Exit.denied)
    expect(code(() => builder.moveSlice('cancel', 'SHOP-1', 'T2', { reason: 'x' }))).toBe(Exit.denied)
    t.eng(LEAD).moveSlice('retry', 'SHOP-1', 'T1')
    // the lead and the owner work on any slice
    builder.moveSlice('start', 'SHOP-1', 'T1')
    t.eng(OWNER).moveSlice('done', 'SHOP-1', 'T1', { files: ['a'] })
  })

  test('submit refuses while a slice runs', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    expect(code(() => lead.moveItem('submit', 'SHOP-1'))).toBe(Exit.refused)
  })
})

describe('Engineering.addGuess and decideGuess', () => {
  test('a guess is recorded with its impact and slices; a flip resets only those slices', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }]))
    const lead = t.eng(LEAD)
    const builder = t.eng(BUILDER)
    for (const id of ['T1', 'T2', 'T3']) {
      lead.moveSlice('start', 'SHOP-1', id)
      lead.moveSlice('done', 'SHOP-1', id, { files: [`${id}.ts`] })
    }
    const guess = builder.addGuess('SHOP-1', { question: 'which time zone?', took: 'UTC', other: 'local', impact: 'med', slices: ['T1', 'T2'] })
    expect(guess).toMatchObject({ id: 'G1', status: 'open', slices: ['T1', 'T2'], by: 'backend-builder-ab12' })
    expect(code(() => builder.addGuess('SHOP-1', { question: 'q', took: 'a', other: 'b', impact: 'huge', slices: [] }))).toBe(Exit.usage)
    expect(code(() => builder.decideGuess('SHOP-1', 'G1', 'flip'))).toBe(Exit.denied)
    const flipped = lead.decideGuess('SHOP-1', 'G1', 'flip', 'local time')
    expect(flipped.reset).toEqual(['T1', 'T2'])
    expect(lead.stores.slices.list('SHOP-1').map(s => s.state)).toEqual(['todo', 'todo', 'done'])
    expect(lead.stores.guesses.list('SHOP-1')[0]).toMatchObject({ status: 'flipped', answer: 'local time' })
    expect(lead.stores.guesses.list(undefined, true)).toEqual([])
    const second = lead.addGuess('SHOP-1', { question: 'retry count?', took: '3', other: '5', impact: 'low', slices: [] })
    expect(lead.decideGuess('SHOP-1', second.id, 'accept').status).toBe('accepted')
  })

  test('the slices of an open guess can be named after the slicing, and a flip then resets them', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.eng(LEAD)
    lead.addGuess('SHOP-1', { question: 'which zone?', took: 'UTC', other: 'local', impact: 'low', slices: [] })
    expect(lead.setGuessSlices('SHOP-1', 'g1', ['T2']).slices).toEqual(['T2'])
    expect(code(() => lead.setGuessSlices('SHOP-1', 'G1', ['T9']))).toBe(Exit.usage)
    for (const id of ['T1', 'T2']) {
      lead.moveSlice('start', 'SHOP-1', id)
      lead.moveSlice('done', 'SHOP-1', id, { files: [`${id}.ts`] })
    }
    expect(lead.decideGuess('SHOP-1', 'G1', 'flip').reset).toEqual(['T2'])
  })

  test('a flip on a done item records the answer and resets no slice', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['T1.ts'] })
    lead.addGuess('SHOP-1', { question: 'which time zone?', took: 'UTC', other: 'local', impact: 'low', slices: ['T1'] })
    lead.ledger.run("UPDATE item SET state = 'done' WHERE id = 'SHOP-1'")
    const flipped = lead.decideGuess('SHOP-1', 'G1', 'flip', 'the code took local time')
    expect([flipped.status, flipped.reset, lead.stores.slices.list('SHOP-1').map(s => s.state)]).toEqual(['flipped', [], ['done']])
  })
})
