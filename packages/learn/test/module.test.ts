import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Course } from '../src/course.ts'
import { learnModule } from '../src/module.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-learn-module-')))
  writeFileSync(join(root, 'nook.yml'), 'packs: [learn]\nlearn: { dir: learn }\n')
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const english = () => new Course(join(root, 'learn', 'english'), 'english')

describe('learnModule', () => {
  test('setup makes the folder of the courses; with no learn section the pack is not configured', () => {
    expect(learnModule.setup(root)).toEqual(['learn/'])
    expect(existsSync(join(root, 'learn'))).toBe(true)
    writeFileSync(join(root, 'nook.yml'), 'packs: [learn]\n')
    expect(learnModule.configured(root)).toBe(false)
  })

  test('the doctor names a course folder with no roadmap, and its fix', () => {
    mkdirSync(join(root, 'learn', 'english'), { recursive: true })
    expect(learnModule.doctor(root)).toEqual([{ level: 'warn', where: 'learn', text: 'learn/english has no roadmap.md', fix: 'run /learn-setup english' }])
  })

  test('the brief names the cards due and a day with no practice yet', () => {
    const c = english()
    c.create()
    c.deck.add('a', 'b', '2026-10-15')
    c.deck.add('c', 'd', '2026-10-15')
    expect(learnModule.brief!(root, new Date(2026, 9, 15), new Date(2026, 9, 16, 9, 0))).toEqual([
      { part: 'waits', text: 'english: 2 cards due, no practice yet today', action: '/learn-today english' },
    ])
  })

  test('a day that is practised with no card due is done', () => {
    const c = english()
    c.create()
    c.addMistake({ pattern: 'articles', yours: 'a', fix: 'b' }, '2026-10-16')
    expect(learnModule.brief!(root, new Date(2026, 9, 15), new Date(2026, 9, 16, 9, 0))).toEqual([{ part: 'done', text: 'english: practised today' }])
  })
})
