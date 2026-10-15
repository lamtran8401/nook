import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { branchItem, classify, commitItem, commitPlan, isTestFile, prove } from '../src/git.ts'
import { lastRun, verifiedAt, verify } from '../src/model/checks.ts'
import { getItem, newItem } from '../src/model/items.ts'
import { moveItem } from '../src/model/moves.ts'
import { moveSlice, slices } from '../src/model/slices.ts'
import { itemAt, LEAD, makeHome, OWNER, READER, SPEC, TASKS, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const failure = (work: () => unknown): EvError => {
  try {
    work()
  } catch (error) {
    return error as EvError
  }
  throw new Error('expected a failure')
}

describe('item verify', () => {
  test('runs the checks of each area in its folder and writes one check_run row for each', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff', 'web'] }), TASKS([{ id: 'T1' }, { id: 'T2', area: 'web' }]))
    const lead = t.kit(LEAD)
    t.fail('web', true)
    const run = verify(t.kit(READER), 'SHOP-1')
    expect(run.map(r => [r.area, r.check, r.result])).toEqual([['bff', 'sh test.sh', 'pass'], ['web', 'sh test.sh', 'fail']])
    expect(run[1]!.output).toContain('FAIL marker')
    expect(run.every(r => r.at === run[0]!.at)).toBe(true)
    expect(verifiedAt(lead, getItem(lead, 'SHOP-1'))).toBeNull()
    t.fail('web', false)
    const second = verify(lead, 'SHOP-1', 'web')
    expect(second).toHaveLength(1)
    expect(verifiedAt(lead, getItem(lead, 'SHOP-1'))).toBe(second[0]!.at)
    expect(lastRun(lead, getItem(lead, 'SHOP-1'))).toEqual(second)
    expect((lead.db.query('SELECT COUNT(*) AS n FROM check_run').get() as { n: number }).n).toBe(3)
  })

  test('refuses with the fix when kit.yml has no areas or the area has no checks', () => {
    const bare = makeHome({ section: false })
    try {
      newItem(bare.kit(LEAD), { id: 'SHOP-1', title: 'x' })
      const error = failure(() => verify(bare.kit(LEAD), 'SHOP-1'))
      expect(error.code).toBe(Exit.refused)
      expect(error.fix).toBe('add areas to kit.yml with /setup')
    } finally {
      bare.cleanup()
    }
    const noChecks = makeHome({ checks: false })
    try {
      itemAt(noChecks, 'backlog')
      const error = failure(() => verify(noChecks.kit(LEAD), 'SHOP-1'))
      expect(error.code).toBe(Exit.refused)
      expect(error.message).toContain('area bff has no `checks` in kit.yml')
    } finally {
      noChecks.cleanup()
    }
  })
})

describe('E-15 task prove', () => {
  const writeTest = (area: string, name: string, body: string) => {
    mkdirSync(join(t.area(area), 'tests'), { recursive: true })
    writeFileSync(join(t.area(area), 'tests', name), body)
  }

  test('proven when the new test fails on the base; weak when it passes; none on a load error', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    writeFileSync(join(t.area('bff'), 'feature.txt'), 'the feature')
    writeTest('bff', 'feature.test.sh', 'test -f feature.txt')
    writeTest('bff', 'always.test.sh', 'true')
    writeTest('bff', 'broken.test.sh', 'cat nothing-here.txt')
    const proven = prove(t.kit(READER), 'SHOP-1', 'T1', ['feature.txt', 'tests/feature.test.sh'])
    expect(proven.proof).toBe('proven')
    expect(proven.tests).toEqual(['tests/feature.test.sh'])
    expect(slices(lead, 'SHOP-1')[0]).toMatchObject({ proof: 'proven' })
    expect(prove(lead, 'SHOP-1', 'T1', ['tests/always.test.sh']).proof).toBe('weak')
    const none = prove(lead, 'SHOP-1', 'T1', ['tests/broken.test.sh'])
    expect(none.proof).toBe('none')
    expect(none.note).toContain('did not run')
    expect(prove(lead, 'SHOP-1', 'T1', ['feature.txt']).note).toBe('the slice has no test file')
    expect(existsSync(join(t.root, '.kit', 'prove', 'SHOP-1-T1'))).toBe(false)
    expect(t.git('bff', 'worktree', 'list').split('\n')).toHaveLength(1)
    // the area checkout keeps its files
    expect(existsSync(join(t.area('bff'), 'feature.txt'))).toBe(true)
  })

  test('a slice marked proof: none in tasks.md is skipped; prove needs cooking', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1', proof: 'none (a config change)' }]))
    const lead = t.kit(LEAD)
    expect(slices(lead, 'SHOP-1')[0]!.proof).toBe('skipped')
    expect(prove(lead, 'SHOP-1', 'T1', ['config.yml']).proof).toBe('skipped')
    const other = makeHome()
    try {
      itemAt(other, 'ready')
      expect(failure(() => prove(other.kit(LEAD), 'SHOP-1', 'T1', ['tests/a.test.sh'])).code).toBe(Exit.refused)
    } finally {
      other.cleanup()
    }
  })

  test('classify and isTestFile', () => {
    expect(classify(0, 'ok')[0]).toBe('weak')
    expect(classify(1, "Error: Cannot find module './x'")[0]).toBe('none')
    expect(classify(1, 'expect(received).toBe(expected)')[0]).toBe('proven')
    expect(['tests/a.sh', 'src/__tests__/a.ts', 'a.test.ts', 'a.spec.js', 'a_test.go', 'test_a.py'].every(isTestFile)).toBe(true)
    expect(['src/a.ts', 'testing.ts'].some(isTestFile)).toBe(false)
  })
})

describe('item branch and item commit', () => {
  test('branch makes kit/<id>-<slug> in each git area and refuses an area in use', () => {
    itemAt(t, 'ready')
    const lead = t.kit(LEAD)
    const made = branchItem(lead, 'SHOP-1')
    expect(made).toEqual([{ area: 'bff', branch: 'kit/SHOP-1-the-export-date-is-off', made: true }])
    expect(t.git('bff', 'branch', '--show-current')).toBe('kit/SHOP-1-the-export-date-is-off')
    expect(branchItem(lead, 'SHOP-1')[0]!.made).toBe(false)
    moveItem(lead, 'begin', 'SHOP-1')
    itemAt(t, 'ready', 'SHOP-14')
    const error = failure(() => branchItem(lead, 'SHOP-14'))
    expect(error.code).toBe(Exit.refused)
    expect(error.message).toBe('area bff is in use by SHOP-1')
    expect(failure(() => branchItem(t.kit(READER), 'SHOP-1')).code).toBe(Exit.denied)
  })

  test('commit prints the plan, one commit for each done slice from its files, refuses a protected branch, never pushes', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    writeFileSync(join(t.area('bff'), 'src.txt'), 'the fix')
    mkdirSync(join(t.area('bff'), 'tests'), { recursive: true })
    writeFileSync(join(t.area('bff'), 'tests', 'a.test.sh'), 'true')
    writeFileSync(join(t.area('bff'), 'other.txt'), 'not of the slice')
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    moveSlice(lead, 'done', 'SHOP-1', 'T1', { files: ['src.txt', 'projects/bff/tests/a.test.sh'] })
    const plan = commitPlan(lead, 'SHOP-1')
    expect(plan.entries).toHaveLength(1)
    expect(plan.entries[0]).toMatchObject({ slice: 'T1', area: 'bff', branch: 'kit/SHOP-1-work', files: ['src.txt', 'tests/a.test.sh'], message: 'SHOP-1 T1: slice T1' })
    expect(t.git('bff', 'log', '--oneline').split('\n')).toHaveLength(1)
    t.git('bff', 'switch', '-q', 'main')
    const refused = failure(() => commitItem(lead, 'SHOP-1'))
    expect(refused.code).toBe(Exit.refused)
    expect(refused.message).toContain('area bff is on main')
    expect(refused.fix).toBe('kit eng item branch SHOP-1')
    t.git('bff', 'switch', '-q', 'kit/SHOP-1-work')
    const done = commitItem(lead, 'SHOP-1')
    expect(done.entries[0]!.commit).toMatch(/^[0-9a-f]{7,}$/)
    expect(t.git('bff', 'log', '--oneline').split('\n')).toHaveLength(2)
    expect(t.git('bff', 'show', '--stat', '--format=', 'HEAD')).toContain('src.txt')
    expect(t.git('bff', 'status', '--porcelain')).toContain('other.txt')
  })
})
