import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { readAreas, readBoard, readDocs, readItem } from '../src/read/reader.ts'
import { itemAt, LEAD, makeHome, PLAN, READER, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('readAreas', () => {
  test('gives the areas of the desk in the order of nook.yml', () => {
    expect(readAreas(t.root)).toEqual(['bff', 'web'])
  })

  test('gives none for a folder with no engineering home', () => {
    const bare = mkdtempSync(join(tmpdir(), 'nook-no-home-'))
    try {
      expect(readAreas(bare)).toEqual([])
    } finally {
      rmSync(bare, { recursive: true, force: true })
    }
  })
})

describe('readBoard', () => {
  test('gives each open item with its kind, size, state, areas and criteria met out of all', () => {
    itemAt(t, 'cooking')
    t.eng(LEAD).newItem({ id: 'SHOP-2', title: 'export the list', kind: 'chore', size: 'M', areas: ['web'] })
    t.eng(READER).markCriterion('SHOP-1', 1, 'the date test passes', 'run')
    expect(readBoard(t.root)).toEqual([
      expect.objectContaining({ id: 'SHOP-1', title: 'the export date is off', kind: 'feature', size: 'S', state: 'cooking', areas: ['bff'], criteria: { met: 1, total: 2 } }),
      { id: 'SHOP-2', title: 'export the list', kind: 'chore', size: 'M', state: 'backlog', areas: ['web'], criteria: { met: 0, total: 0 }, slices: { done: 0, total: 0 }, next: { owner: false, skill: '/spec SHOP-2' }, flags: [] },
    ])
  })

  test('gives whose move is next, the slices done, and a flag for each blocking question and failed slice', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('fail', 'SHOP-1', 'T1', { reason: 'cannot' })
    lead.ask('SHOP-1', 'Must a refund go to the same card?', true)
    expect(readBoard(t.root)[0]).toMatchObject({ slices: { done: 0, total: 2 }, next: { owner: true, skill: expect.stringMatching(/^answer Q1/) }, flags: ['Q1 blocks', 'T1 failed'] })
  })
})

describe('readItem', () => {
  test('puts what waits for the owner first: the blocking questions, then the other open ones, then the open guesses', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.ask('SHOP-1', 'Does the export keep the filter?', false)
    lead.ask('SHOP-1', 'Must a refund go to the same card?', true)
    const answered = lead.ask('SHOP-1', 'Which zone?', false)
    lead.answer('SHOP-1', answered.id, 'UTC')
    lead.addGuess('SHOP-1', { question: 'Sort by?', took: 'the last update', other: 'the ship date', impact: 'high', slices: [] })
    const view = readItem(t.root, 'SHOP-1')
    expect(view.needs.questions.map(q => q.text)).toEqual(['Must a refund go to the same card?', 'Does the export keep the filter?'])
    expect(view.needs.guesses.map(g => g.took)).toEqual(['the last update'])
    expect(view.questions).toHaveLength(3)
  })

  test('names the move of the owner in planning, and the move of the lead in cooking', () => {
    itemAt(t, 'planning', 'SHOP-1')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    t.eng(LEAD).importTasks('SHOP-1')
    itemAt(t, 'cooking', 'SHOP-2', SPEC().replaceAll('SHOP-1', 'SHOP-2'))
    expect(readItem(t.root, 'SHOP-1').next).toMatchObject({ owner: true, skill: 'owner: /gate approve SHOP-1' })
    expect(readItem(t.root, 'SHOP-2').next.owner).toBe(false)
  })

  test('gives each change of state with its move and its time, and leaves out the other events', () => {
    itemAt(t, 'cooking')
    t.eng(LEAD).ask('SHOP-1', 'Does the export keep the filter?', false)
    const moves = readItem(t.root, 'SHOP-1').moves
    expect(moves.map(m => `${m.move} → ${m.to}`)).toEqual(['new → backlog', 'start → framing', 'agree → planning', 'approve → ready', 'begin → cooking'])
    expect(moves.every(m => /^\d{4}-\d\d-\d\dT/.test(m.at))).toBe(true)
  })

  test('gives each event as a sentence, in order', () => {
    itemAt(t, 'cooking')
    const titles = readItem(t.root, 'SHOP-1').events.map(e => e.title)
    expect(titles.slice(0, 2)).toEqual(['The lead added the item', 'The lead started the spec'])
    expect(titles).toContain('You approved the plan')
    expect(titles.at(-1)).toBe('The lead began the build')
  })

  test('gives the changed files of each area on its branch, against the main branch', () => {
    itemAt(t, 'cooking')
    writeFileSync(join(t.area('bff'), 'export.ts'), 'utc\nformat\n')
    expect(readItem(t.root, 'SHOP-1').changes).toEqual([
      { area: 'bff', branch: 'nook/SHOP-1-work', files: [{ path: 'export.ts', state: 'new', add: 2, del: 0 }] },
    ])
  })

  test('gives no changes for an area that is still on its main branch', () => {
    itemAt(t, 'planning')
    expect(readItem(t.root, 'SHOP-1').changes).toEqual([])
  })

  test('refuses a ledger that needs a migration, and runs none', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    const migrations = () => lead.ledger.get<{ n: number }>('SELECT COUNT(*) AS n FROM migration')!.n
    lead.ledger.run('DELETE FROM migration WHERE n = (SELECT MAX(n) FROM migration)')
    const before = migrations()
    expect(() => readItem(t.root, 'SHOP-1')).toThrow('the ledger needs 1 migration')
    expect(migrations()).toBe(before)
  })
})

describe('readDocs', () => {
  test('gives the text of each document of the item, and null for one not written yet', () => {
    itemAt(t, 'planning')
    const docs = readDocs(t.root, 'SHOP-1')
    expect(docs.spec).toContain('# SHOP-1: the export date is off')
    expect(docs.walkthrough).toBeNull()
  })
})
