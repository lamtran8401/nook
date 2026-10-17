import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'

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
    const lead = t.eng(LEAD)
    lead.ask('SHOP-1', 'which zone?', false, 'UTC')
    const slice = taskBrief(lead, 'SHOP-1', 'T1')
    expect(slice).toContain(`area: bff → ${t.area('bff')} (backend); test: sh test.sh {files}`)
    expect(slice).toContain('1 [ADD] the export has the right date')
    expect(slice).toContain('nook eng task prove SHOP-1 T1')
  })

  test('prints the files line of the slice in tasks.md', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }]).replace('- size: S\n', '- size: S\n- files: the export, its tests\n'))
    expect(taskBrief(t.eng(LEAD), 'SHOP-1', 'T1')).toContain('\nfiles: the export, its tests\n')
  })

  test('prints no files line when the slice has none', () => {
    itemAt(t, 'cooking')
    expect(taskBrief(t.eng(LEAD), 'SHOP-1', 'T1')).not.toContain('\nfiles:')
  })

  test('prints the done when line of the slice in tasks.md', () => {
    itemAt(t, 'cooking')
    expect(taskBrief(t.eng(LEAD), 'SHOP-1', 'T1')).toContain('\ndone when: the test passes\n')
  })

  test('prints the open guesses of the slice and of the whole item, and not those of another slice', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.eng(LEAD)
    lead.addGuess('SHOP-1', { question: 'which zone?', took: 'UTC', other: 'local', impact: 'med', slices: ['T1'] })
    lead.addGuess('SHOP-1', { question: 'which order?', took: 'newest first', other: 'oldest first', impact: 'low', slices: [] })
    lead.addGuess('SHOP-1', { question: 'which font?', took: 'mono', other: 'sans', impact: 'low', slices: ['T2'] })
    expect(taskBrief(lead, 'SHOP-1', 'T1')).toContain('\nguesses:\n  G1 (med) which zone? took UTC, not local\n  G2 (low) which order? took newest first, not oldest first\nproof: none')
  })

  test('prints the live decisions of the item and of the area of the slice, with the first sentence of each', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    const decide = (title: string, item: string | undefined, scope: string, decision: string) => {
      const adr = lead.stores.adrs.create(title, item)
      const text = readFileSync(adr.file, 'utf8')
        .replace(`# ADR ${adr.n}: ${title}\n`, `# ADR ${adr.n}: ${title}\nScope: ${scope}\n`)
        .replace('<!-- the choice, in one or two sentences -->', decision)
      writeFileSync(adr.file, text)
      return adr
    }
    decide('An empty value means no filter', 'SHOP-1', 'web', 'An empty value lists every row. The web sends no key.')
    decide('Dates are UTC in the bff', undefined, 'bff, web', 'The bff stores each date in UTC.')
    decide('The frontend uses one store', undefined, 'web', 'One store for the state.')
    const old = decide('Dates are local', undefined, 'bff', 'Local dates.')
    lead.stores.adrs.setStatus(old, 'superseded', 2)
    expect(taskBrief(lead, 'SHOP-1', 'T1')).toContain(
      '\ndecisions:\n  ADR 1 An empty value means no filter: An empty value lists every row.\n  ADR 2 Dates are UTC in the bff: The bff stores each date in UTC.\nproof:',
    )
  })
})
