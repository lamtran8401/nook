import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { taskBrief } from '../src/report/task-brief.ts'
import { itemAt, LEAD, makeHome, TASKS, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('taskBrief', () => {
  test('names the area folder with its test command, the criteria of the slice and the commands to run', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS(Array.from({ length: 30 }, (_, i) => ({ id: `T${i + 1}`, title: `a long slice title number ${i + 1} that goes on and on for a while` }))))
    const lead = t.kit(LEAD)
    lead.ask('SHOP-1', 'which zone?', false, 'UTC')
    const slice = taskBrief(lead, 'SHOP-1', 'T1')
    expect(slice).toContain(`area: bff → ${t.area('bff')} (backend); test: sh test.sh {files}`)
    expect(slice).toContain('1 [ADD] the export has the right date')
    expect(slice).toContain('kit eng task prove SHOP-1 T1')
  })

  test('prints the files line of the slice in tasks.md', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }]).replace('- size: S\n', '- size: S\n- files: the export, its tests\n'))
    expect(taskBrief(t.kit(LEAD), 'SHOP-1', 'T1')).toContain('\nfiles: the export, its tests\n')
  })

  test('prints no files line when the slice has none', () => {
    itemAt(t, 'cooking')
    expect(taskBrief(t.kit(LEAD), 'SHOP-1', 'T1')).not.toContain('\nfiles:')
  })

  test('prints the done when line of the slice in tasks.md', () => {
    itemAt(t, 'cooking')
    expect(taskBrief(t.kit(LEAD), 'SHOP-1', 'T1')).toContain('\ndone when: the test passes\n')
  })

  test('prints the open guesses of the slice and of the whole item, and not those of another slice', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.kit(LEAD)
    lead.addGuess('SHOP-1', { question: 'which zone?', took: 'UTC', other: 'local', impact: 'med', slices: ['T1'] })
    lead.addGuess('SHOP-1', { question: 'which order?', took: 'newest first', other: 'oldest first', impact: 'low', slices: [] })
    lead.addGuess('SHOP-1', { question: 'which font?', took: 'mono', other: 'sans', impact: 'low', slices: ['T2'] })
    expect(taskBrief(lead, 'SHOP-1', 'T1')).toContain('\nguesses:\n  G1 (med) which zone? took UTC, not local\n  G2 (low) which order? took newest first, not oldest first\nproof: none')
  })
})
