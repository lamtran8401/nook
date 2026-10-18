import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@nook/shared/errors.ts'

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

describe('Engineering.verify', () => {
  test('runs the checks of each area in its folder and writes one check_run row for each', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff', 'web'] }), TASKS([{ id: 'T1' }, { id: 'T2', area: 'web' }]))
    const lead = t.eng(LEAD)
    t.fail('web', true)
    const run = t.eng(READER).verify('SHOP-1')
    expect(run.map(r => [r.area, r.check, r.result])).toEqual([['bff', 'sh test.sh', 'pass'], ['web', 'sh test.sh', 'fail']])
    expect(run[1]!.output).toContain('FAIL marker')
    expect(run.every(r => r.at === run[0]!.at)).toBe(true)
    expect(lead.stores.checks.verifiedAt(lead.item('SHOP-1'))).toBeNull()
    t.fail('web', false)
    const second = lead.verify('SHOP-1', 'web')
    expect(second).toHaveLength(1)
    expect(lead.stores.checks.verifiedAt(lead.item('SHOP-1'))).toBe(second[0]!.at)
    expect(lead.stores.checks.lastRun(lead.item('SHOP-1')).map(r => [r.area, r.check, r.result])).toEqual([['web', 'sh test.sh', 'pass']])
    expect(lead.ledger.get<{ n: number }>('SELECT COUNT(*) AS n FROM check_run')?.n).toBe(3)
  })

  test('refuses with the fix when nook.yml has no areas or the area has no checks', () => {
    const bare = makeHome({ section: false })
    try {
      bare.eng(LEAD).newItem({ id: 'SHOP-1', title: 'x' })
      const error = failure(() => bare.eng(LEAD).verify('SHOP-1'))
      expect(error.code).toBe(Exit.refused)
      expect(error.fix).toBe('add areas to nook.yml with /setup')
    } finally {
      bare.cleanup()
    }
    const noChecks = makeHome({ checks: false })
    try {
      itemAt(noChecks, 'backlog')
      const error = failure(() => noChecks.eng(LEAD).verify('SHOP-1'))
      expect(error.code).toBe(Exit.refused)
      expect(error.message).toContain('area bff has no `checks` in nook.yml')
    } finally {
      noChecks.cleanup()
    }
  })
})

describe('Engineering.verify with an area install', () => {
  // the install makes node_modules and logs one line for each run; the lockfile is bun.lock
  const INSTALL_SH = 'mkdir -p node_modules && echo run >> installs.log\n'
  const installs = () => readFileSync(join(t.area('bff'), 'installs.log'), 'utf8').split('\n').filter(Boolean).length
  const rows = (run: { area: string; check: string; result: string }[]) => run.map(r => [r.area, r.check, r.result])
  const withInstall = (script = INSTALL_SH, lockfile = true) => {
    t.cleanup()
    t = makeHome({ install: 'sh install.sh' })
    writeFileSync(join(t.area('bff'), 'install.sh'), script)
    if (lockfile) writeFileSync(join(t.area('bff'), 'bun.lock'), 'lock v1\n')
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff', 'web'] }), TASKS([{ id: 'T1' }, { id: 'T2', area: 'web' }]))
  }

  test('an area with no dependencies installs first, and the run records the install before the checks', () => {
    withInstall()
    const run = t.eng(LEAD).verify('SHOP-1')
    expect(rows(run)).toEqual([['bff', 'install: sh install.sh', 'pass'], ['bff', 'sh test.sh', 'pass'], ['web', 'sh test.sh', 'pass']])
    expect(installs()).toBe(1)
  })

  test('no install runs when the lockfile has not changed since the last install', () => {
    withInstall()
    const lead = t.eng(LEAD)
    lead.verify('SHOP-1')
    expect(rows(lead.verify('SHOP-1'))).toEqual([['bff', 'sh test.sh', 'pass'], ['web', 'sh test.sh', 'pass']])
    expect(installs()).toBe(1)
  })

  test('an install that writes the lockfile records that lockfile, so the next run does not install again', () => {
    withInstall(`${INSTALL_SH}echo "lock written" > bun.lock\n`, false)
    const lead = t.eng(LEAD)
    lead.verify('SHOP-1')
    expect(rows(lead.verify('SHOP-1'))[0]).toEqual(['bff', 'sh test.sh', 'pass'])
    expect(installs()).toBe(1)
  })

  test('the install runs again after the lockfile changes, and after its dependency folder goes', () => {
    withInstall()
    const lead = t.eng(LEAD)
    lead.verify('SHOP-1')
    writeFileSync(join(t.area('bff'), 'bun.lock'), 'lock v2\n')
    expect(rows(lead.verify('SHOP-1'))[0]).toEqual(['bff', 'install: sh install.sh', 'pass'])
    rmSync(join(t.area('bff'), 'node_modules'), { recursive: true })
    lead.verify('SHOP-1')
    expect(installs()).toBe(3)
  })

  test('a failed install runs no check of its area, and the run names the install with its error lines', () => {
    withInstall('echo resolving\necho "error: bun.lock is broken" >&2\nexit 1\n')
    const lead = t.eng(LEAD)
    const run = lead.verify('SHOP-1')
    expect(rows(run)).toEqual([['bff', 'install: sh install.sh', 'fail'], ['web', 'sh test.sh', 'pass']])
    expect(run[0]!.output).toBe('error: bun.lock is broken')
    expect(lead.stores.checks.verifiedAt(lead.item('SHOP-1'))).toBeNull()
  })

  test('task prove installs a changed area before the proof, and refuses when the install fails', () => {
    withInstall()
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    mkdirSync(join(t.area('bff'), 'tests'), { recursive: true })
    writeFileSync(join(t.area('bff'), 'tests', 'deps.test.sh'), 'test -d node_modules && test -f feature.txt')
    expect(lead.prove('SHOP-1', 'T1', ['tests/deps.test.sh']).proof).toBe('proven')
    expect(installs()).toBe(1)
    writeFileSync(join(t.area('bff'), 'install.sh'), 'echo "error: no network" >&2\nexit 1\n')
    writeFileSync(join(t.area('bff'), 'bun.lock'), 'lock v2\n')
    const error = failure(() => lead.prove('SHOP-1', 'T1', ['tests/deps.test.sh']))
    expect(error).toMatchObject({ code: Exit.refused, message: 'the install of area bff failed: error: no network' })
  })
})

describe('Engineering.prove', () => {
  const writeTest = (area: string, name: string, body: string) => {
    mkdirSync(join(t.area(area), 'tests'), { recursive: true })
    writeFileSync(join(t.area(area), 'tests', name), body)
  }

  test('proven when the new test fails on the base; weak when it passes; none on a load error', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    writeFileSync(join(t.area('bff'), 'feature.txt'), 'the feature')
    writeTest('bff', 'feature.test.sh', 'test -f feature.txt')
    writeTest('bff', 'always.test.sh', 'true')
    writeTest('bff', 'broken.test.sh', 'cat nothing-here.txt')
    const proven = t.eng(READER).prove('SHOP-1', 'T1', ['feature.txt', 'tests/feature.test.sh'])
    expect(proven.proof).toBe('proven')
    expect(proven.tests).toEqual(['tests/feature.test.sh'])
    expect(lead.stores.slices.list('SHOP-1')[0]).toMatchObject({ proof: 'proven' })
    expect(lead.prove('SHOP-1', 'T1', ['tests/always.test.sh']).proof).toBe('weak')
    const none = lead.prove('SHOP-1', 'T1', ['tests/broken.test.sh'])
    expect(none.proof).toBe('none')
    expect(none.note).toContain('did not run')
    expect(lead.prove('SHOP-1', 'T1', ['feature.txt']).note).toBe('the slice has no test file')
    expect(existsSync(join(t.root, '.nook', 'prove', 'SHOP-1-T1'))).toBe(false)
    expect(t.git('bff', 'worktree', 'list').split('\n')).toHaveLength(1)
    // the area checkout keeps its files
    expect(existsSync(join(t.area('bff'), 'feature.txt'))).toBe(true)
  })

  test('a slice marked proof: none in tasks.md is skipped; prove needs cooking', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1', proof: 'none (a config change)' }]))
    const lead = t.eng(LEAD)
    expect(lead.stores.slices.list('SHOP-1')[0]!.proof).toBe('skipped')
    expect(lead.prove('SHOP-1', 'T1', ['config.yml']).proof).toBe('skipped')
    const other = makeHome()
    try {
      itemAt(other, 'ready')
      expect(failure(() => other.eng(LEAD).prove('SHOP-1', 'T1', ['tests/a.test.sh'])).code).toBe(Exit.refused)
    } finally {
      other.cleanup()
    }
  })
})

describe('Engineering.branch and commit', () => {
  test('branch makes nook/<id>-<slug> in each git area and refuses an area in use', () => {
    itemAt(t, 'ready')
    const lead = t.eng(LEAD)
    const made = lead.branch('SHOP-1')
    expect(made).toEqual([{ area: 'bff', branch: 'nook/SHOP-1-the-export-date-is-off', made: true }])
    expect(t.git('bff', 'branch', '--show-current')).toBe('nook/SHOP-1-the-export-date-is-off')
    expect(lead.branch('SHOP-1')[0]!.made).toBe(false)
    lead.moveItem('begin', 'SHOP-1')
    itemAt(t, 'ready', 'SHOP-14')
    const error = failure(() => lead.branch('SHOP-14'))
    expect(error.code).toBe(Exit.refused)
    expect(error.message).toBe('area bff is in use by SHOP-1')
    expect(failure(() => t.eng(READER).branch('SHOP-1')).code).toBe(Exit.denied)
  })

  test('commit prints the plan, one commit for each done slice from its files, refuses a protected branch, never pushes', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    writeFileSync(join(t.area('bff'), 'src.txt'), 'the fix')
    mkdirSync(join(t.area('bff'), 'tests'), { recursive: true })
    writeFileSync(join(t.area('bff'), 'tests', 'a.test.sh'), 'true')
    writeFileSync(join(t.area('bff'), 'other.txt'), 'not of the slice')
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['src.txt', 'projects/bff/tests/a.test.sh'] })
    const plan = lead.commitPlan('SHOP-1')
    expect(plan.entries).toHaveLength(1)
    expect(plan.entries[0]).toMatchObject({ slice: 'T1', area: 'bff', branch: 'nook/SHOP-1-work', files: ['src.txt', 'tests/a.test.sh'], message: 'SHOP-1 T1: slice T1' })
    expect(t.git('bff', 'log', '--oneline').split('\n')).toHaveLength(1)
    t.git('bff', 'switch', '-q', 'main')
    const refused = failure(() => lead.commit('SHOP-1'))
    expect(refused.code).toBe(Exit.refused)
    expect(refused.message).toContain('area bff is on main')
    expect(refused.fix).toBe('nook eng item branch SHOP-1')
    t.git('bff', 'switch', '-q', 'nook/SHOP-1-work')
    const done = lead.commit('SHOP-1')
    expect(done.entries[0]!.commit).toMatch(/^[0-9a-f]{7,}$/)
    expect(t.git('bff', 'log', '--oneline').split('\n')).toHaveLength(2)
    expect(t.git('bff', 'show', '--stat', '--format=', 'HEAD')).toContain('src.txt')
    expect(t.git('bff', 'status', '--porcelain')).toContain('other.txt')
  })

  test('a second commit gives each changed file to the slice that touched it last, and skips a slice with nothing new', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC(), TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.eng(LEAD)
    writeFileSync(join(t.area('bff'), 'src.txt'), 'the fix')
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['src.txt'] })
    lead.commit('SHOP-1')
    writeFileSync(join(t.area('bff'), 'src.txt'), 'the fix, cleaned')
    writeFileSync(join(t.area('bff'), 'b.txt'), 'a new helper')
    lead.moveSlice('start', 'SHOP-1', 'T2')
    lead.moveSlice('done', 'SHOP-1', 'T2', { files: ['src.txt', 'b.txt'] })
    const plan = lead.commitPlan('SHOP-1')
    expect(plan.entries.map(e => [e.slice, e.files])).toEqual([['T2', ['src.txt', 'b.txt']]])
    expect(plan.skipped).toEqual(['T1: nothing changed since its last commit'])
    lead.commit('SHOP-1')
    expect(t.git('bff', 'log', '--format=%s', '-1')).toBe('SHOP-1 T2: slice T2')
    expect(t.git('bff', 'status', '--porcelain')).toBe('')
  })
})
