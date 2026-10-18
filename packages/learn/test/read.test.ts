import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Course } from '../src/course.ts'
import { readLearn } from '../src/read.ts'

let desk: string
beforeEach(() => {
  desk = realpathSync(mkdtempSync(join(tmpdir(), 'nook-learn-read-')))
  writeFileSync(join(desk, 'nook.yml'), 'packs: [learn]\n')
})
afterEach(() => rmSync(desk, { recursive: true, force: true }))

describe('readLearn', () => {
  test('gives each course with its cards due, its top patterns, and the bands of each criterion in date order', () => {
    const course = new Course(join(desk, 'learn', 'english'), 'english')
    course.create()
    course.deck.add('serendipity', 'a lucky chance find', '2026-10-15')
    course.deck.add('ubiquitous', 'found everywhere', '2026-10-25')
    course.addMistake({ pattern: 'articles', yours: 'I went to office.', fix: 'I went to the office.' }, '2026-10-14')
    course.addScore({ task: 'writing task 2', criterion: 'Lexical Resource', band: '6', evidence: '"very big problem" repeats' }, '2026-10-10')
    course.addScore({ task: 'writing task 1', criterion: 'Coherence and Cohesion', band: '6.5', evidence: 'clear paragraphs' }, '2026-10-12')
    course.addScore({ task: 'writing task 2', criterion: 'Lexical Resource', band: '6.5', evidence: '"a pressing issue"' }, '2026-10-16')
    const [view] = readLearn(desk, '2026-10-18')
    expect(view!.name).toBe('english')
    expect(view!.due.map(c => c.front)).toEqual(['serendipity'])
    expect(view!.patterns).toEqual([{ pattern: 'articles', count: 1, last: '2026-10-14' }])
    expect(view!.trends).toEqual([
      { criterion: 'Lexical Resource', points: [{ date: '2026-10-10', band: '6', task: 'writing task 2' }, { date: '2026-10-16', band: '6.5', task: 'writing task 2' }] },
      { criterion: 'Coherence and Cohesion', points: [{ date: '2026-10-12', band: '6.5', task: 'writing task 1' }] },
    ])
  })

  test('gives no course in a desk with no learn pack', () => {
    writeFileSync(join(desk, 'nook.yml'), 'packs: []\n')
    expect(readLearn(desk, '2026-10-18')).toEqual([])
  })
})
