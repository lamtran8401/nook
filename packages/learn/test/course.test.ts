import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Course } from '../src/course.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'kit-course-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const course = () => new Course(join(root, 'learn', 'english'), 'english')

describe('Course', () => {
  test('create makes the files of a course and keeps a roadmap that exists', () => {
    expect(course().create()).toEqual(['roadmap.md', 'mistakes.md', 'scores.md', 'cards/cards.md', 'study.md'])
    expect(readFileSync(join(root, 'learn/english/mistakes.md'), 'utf8')).toBe('# Mistakes\n\n| Date | Pattern | Yours | Fix |\n|---|---|---|---|\n')
    expect(course().create()).toEqual([])
  })

  test('the top patterns of the mistakes come by count, then by the latest day', () => {
    const c = course()
    c.addMistake({ pattern: 'articles', yours: 'I went to office.', fix: 'I went to the office.' }, '2026-10-14')
    c.addMistake({ pattern: 'tense after since', yours: 'I live here since 2020.', fix: 'I have lived here since 2020.' }, '2026-10-15')
    c.addMistake({ pattern: 'articles', yours: 'She is engineer.', fix: 'She is an engineer.' }, '2026-10-16')
    c.addMistake({ pattern: 'prepositions', yours: 'on Monday morning at', fix: 'on Monday morning' }, '2026-10-16')
    expect(c.topPatterns(2)).toEqual([
      { pattern: 'articles', count: 2, last: '2026-10-16' },
      { pattern: 'prepositions', count: 1, last: '2026-10-16' },
    ])
  })

  test('a score names its task, its criterion, its band and its evidence', () => {
    const c = course()
    c.addScore({ task: 'writing task 2', criterion: 'Lexical Resource', band: '6', evidence: '"very big problem" repeats; no less common words' }, '2026-10-16')
    expect(c.scores()).toEqual([{ date: '2026-10-16', task: 'writing task 2', criterion: 'Lexical Resource', band: '6', evidence: '"very big problem" repeats; no less common words' }])
  })

  test('a day counts as practised when it holds a mistake, a score or a card review', () => {
    const c = course()
    c.create()
    expect(c.practisedOn('2026-10-16')).toBe(false)
    c.addMistake({ pattern: 'articles', yours: 'a', fix: 'b' }, '2026-10-16')
    expect(c.practisedOn('2026-10-16')).toBe(true)
    c.deck.add('a', 'b', '2026-10-16')
    c.deck.review('C1', 'good', '2026-10-17')
    expect(c.practisedOn('2026-10-17')).toBe(true)
  })

  test('a course with no roadmap is not set up', () => {
    expect(course().isSetUp()).toBe(false)
    course().create()
    expect([course().isSetUp(), existsSync(join(root, 'learn/english/roadmap.md'))]).toEqual([true, true])
  })
})
