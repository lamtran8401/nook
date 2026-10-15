import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { verify } from '../src/model/checks.ts'
import { addCriterion, criteria, markCriterion } from '../src/model/criteria.ts'
import { approvedHashes, gaps } from '../src/model/guards.ts'
import { editItem, getItem, history, newItem, setMode } from '../src/model/items.ts'
import { moveItem, quickItem } from '../src/model/moves.ts'
import { ask, answer } from '../src/model/questions.ts'
import { importTasks, moveSlice, slices } from '../src/model/slices.ts'
import { BUILDER, itemAt, LEAD, makeHome, OWNER, PLAN, READER, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const fails = (work: () => unknown, code: number, text?: string | RegExp, fix?: string | RegExp) => {
  let caught: unknown
  try {
    work()
  } catch (error) {
    caught = error
  }
  expect(caught).toBeInstanceOf(EvError)
  const error = caught as EvError
  expect(error.code as number).toBe(code)
  if (text) expect(error.message).toMatch(text)
  if (fix) expect(error.fix).toMatch(fix)
  return error
}

/** Finishes the one slice of an item in cooking and passes the checks. */
const buildAll = (id = 'SHOP-1') => {
  const lead = t.kit(LEAD)
  for (const s of slices(lead, id).filter(s => s.state !== 'done')) {
    moveSlice(lead, 'start', id, s.id)
    moveSlice(lead, 'done', id, s.id, { files: ['src/export.ts', 'tests/export.test.sh'] })
  }
  verify(lead, id)
}

describe('E-11 to E-13: start, agree, approve', () => {
  test('start scaffolds spec.md from the template with the front matter of the item', () => {
    itemAt(t, 'framing')
    const spec = readFileSync(join(t.root, 'work', 'SHOP-1', 'spec.md'), 'utf8')
    expect(spec).toContain('id: SHOP-1')
    expect(spec).toContain('kind: feature')
    expect(spec).toContain('areas: [bff]')
    expect(getItem(t.kit(), 'SHOP-1').state).toBe('framing')
  })

  test('agree lists every gap of the spec with its fix, then copies the front matter and the criteria', () => {
    itemAt(t, 'framing')
    const lead = t.kit(LEAD)
    const error = fails(() => moveItem(lead, 'agree', 'SHOP-1'), Exit.refused, /no acceptance criterion/, /spec.md/)
    expect(error.message).toContain('fix:')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ areas: ['ghost'], size: 'XL' }))
    const bad = fails(() => moveItem(lead, 'agree', 'SHOP-1'), Exit.refused)
    expect(bad.message).toContain('area "ghost" is not in kit.yml')
    expect(bad.message).toContain('size must be S, M or L')
    ask(lead, 'SHOP-1', 'which time zone?', true, 'UTC')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ areas: ['bff', 'web'], size: 'M' }))
    fails(() => moveItem(lead, 'agree', 'SHOP-1'), Exit.refused, /Q1 is open and blocking/, /kit eng answer SHOP-1 Q1/)
    answer(lead, 'SHOP-1', 'Q1', 'UTC')
    moveItem(lead, 'agree', 'SHOP-1')
    const item = getItem(lead, 'SHOP-1')
    expect(item.state).toBe('planning')
    expect(item.areas).toEqual(['bff', 'web'])
    expect(item.size).toBe('M')
    expect(criteria(lead, 'SHOP-1').map(c => c.text)).toEqual(['[ADD] the export has the right date', '[CHANGE] the error shows a reason'])
    expect(existsSync(join(t.root, 'work', 'SHOP-1', 'plan.md'))).toBe(true)
    expect(existsSync(join(t.root, 'work', 'SHOP-1', 'tasks.md'))).toBe(true)
  })

  test('approve: the plan, the slices, every AC in a slice, one area each, no cycle; then the fingerprints', () => {
    itemAt(t, 'planning')
    const owner = t.kit(OWNER)
    const lead = t.kit(LEAD)
    const first = fails(() => moveItem(owner, 'approve', 'SHOP-1'), Exit.refused)
    expect(first.message).toContain('plan.md is the template, not a plan')
    expect(first.message).toContain('tasks.md: T1: no area')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN.replace(/## Risks\n\nTime zones.\n/, '## Risks\n\n'))
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', acs: '1', depends: 'T2' }, { id: 'T2', acs: '1', depends: 'T1', area: 'web' }]))
    const second = fails(() => moveItem(owner, 'approve', 'SHOP-1'), Exit.refused)
    expect(second.message).toContain('plan.md: ## Risks is empty')
    expect(second.message).toContain('tasks.md and the ledger differ: T1, T2')
    expect(second.message).toContain('AC 2 is in no slice')
    expect(second.message).toContain('T2: area web is not an area of SHOP-1')
    expect(second.message).toContain('depends has a cycle: T1 → T2 → T1')
    expect(second.fix).toContain('work/SHOP-1/plan.md')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(lead, 'SHOP-1')
    expect(gaps(lead, getItem(lead, 'SHOP-1'), 'approve')).toEqual([])
    moveItem(owner, 'approve', 'SHOP-1')
    expect(getItem(owner, 'SHOP-1').state).toBe('ready')
    const hashes = approvedHashes(owner, 'SHOP-1')
    expect([...hashes.keys()].sort()).toEqual(['plan.md', 'spec.md', 'tasks.md'])
    expect(hashes.get('spec.md')).toMatch(/^[0-9a-f]{64}$/)
  })

  test('E-13 only the owner approves; the lead gets exit 5 with the role in the reason', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(t.kit(LEAD), 'SHOP-1')
    fails(() => moveItem(t.kit(LEAD), 'approve', 'SHOP-1'), Exit.denied, 'approve: only the owner can do this (you are lead)')
    fails(() => moveItem(t.kit(BUILDER), 'approve', 'SHOP-1'), Exit.denied, /you are builder/)
    expect(getItem(t.kit(), 'SHOP-1').state).toBe('planning')
  })

  test('E-13 through the launcher: CLAUDECODE set means lead, so approve exits 5; the owner terminal passes', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(t.kit(LEAD), 'SHOP-1')
    const bin = join(import.meta.dir, '..', '..', '..', 'apps', 'kit', 'bin', 'kit')
    const env: Record<string, string | undefined> = { ...process.env }
    delete env.KIT_ROLE
    const asLead = Bun.spawnSync([bin, 'eng', 'item', 'approve', 'SHOP-1'], { cwd: t.root, env: { ...env, CLAUDECODE: '1' }, stdout: 'pipe', stderr: 'pipe' })
    expect(asLead.exitCode).toBe(5)
    expect(asLead.stderr.toString()).toContain('approve: only the owner can do this (you are lead)')
    const envOwner = { ...env }
    delete envOwner.CLAUDECODE
    const asOwner = Bun.spawnSync([bin, 'eng', 'item', 'approve', 'SHOP-1', '--json'], { cwd: t.root, env: envOwner, stdout: 'pipe', stderr: 'pipe' })
    expect(asOwner.exitCode).toBe(0)
    expect(JSON.parse(asOwner.stdout.toString()).state).toBe('ready')
  })
})

describe('E-14, E-15, E-15b: begin and submit', () => {
  test('E-14 a changed plan stops begin with the gap and the fix', () => {
    itemAt(t, 'ready')
    const plan = join(t.root, 'work', 'SHOP-1', 'plan.md')
    writeFileSync(plan, `${readFileSync(plan, 'utf8')}\nmore\n`)
    t.git('bff', 'switch', '-q', '-c', 'kit/SHOP-1-work')
    const error = fails(() => moveItem(t.kit(LEAD), 'begin', 'SHOP-1'), Exit.refused, 'plan.md changed after the approve', 'kit eng item replan SHOP-1')
    expect(error.message).not.toContain('spec.md changed')
    moveItem(t.kit(LEAD), 'replan', 'SHOP-1', { reason: 'the plan changed' })
    expect(approvedHashes(t.kit(), 'SHOP-1').size).toBe(0)
    expect(getItem(t.kit(), 'SHOP-1').state).toBe('planning')
  })

  test('begin needs a non-protected branch in each git area', () => {
    itemAt(t, 'ready')
    fails(() => moveItem(t.kit(LEAD), 'begin', 'SHOP-1'), Exit.refused, 'area bff is on main, a protected branch', 'kit eng item branch SHOP-1')
  })

  test('E-15b a second item in the same area is refused at begin', () => {
    itemAt(t, 'cooking')
    itemAt(t, 'ready', 'SHOP-14')
    fails(() => moveItem(t.kit(LEAD), 'begin', 'SHOP-14'), Exit.refused, 'area bff is in use by SHOP-1', /wait for SHOP-1/)
  })

  test('submit needs every slice done, a passing verify, and warns on a weak proof', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    const none = fails(() => moveItem(lead, 'submit', 'SHOP-1'), Exit.refused)
    expect(none.message).toContain('no slice is done')
    expect(none.message).toContain('T1 is todo')
    expect(none.message).toContain('the checks have not passed')
    expect(none.fix).toContain('kit eng task done SHOP-1')
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    moveSlice(lead, 'done', 'SHOP-1', 'T1', { files: ['src/a.ts'] })
    t.fail('bff', true)
    verify(lead, 'SHOP-1')
    fails(() => moveItem(lead, 'submit', 'SHOP-1'), Exit.refused, 'the checks have not passed since the last move back', 'kit eng item verify SHOP-1')
    t.fail('bff', false)
    verify(lead, 'SHOP-1')
    const result = moveItem(lead, 'submit', 'SHOP-1')
    expect(result.item.state).toBe('checking')
    expect(result.warnings[0]).toContain('T1 is done with proof none')
  })

  test('the slices and the criteria freeze from ready on: exit 3 and "replan first"', () => {
    itemAt(t, 'ready')
    const lead = t.kit(LEAD)
    fails(() => importTasks(lead, 'SHOP-1'), Exit.refused, /frozen after the approve/, /replan first: kit eng item replan SHOP-1/)
    fails(() => addCriterion(lead, 'SHOP-1', 'another'), Exit.refused, /frozen/, 'kit eng item replan SHOP-1')
    fails(() => editItem(lead, 'SHOP-1', 'areas', 'web'), Exit.refused, /frozen/, 'kit eng item replan SHOP-1')
    editItem(lead, 'SHOP-1', 'title', 'a new title')
  })
})

describe('E-16, E-17: accept, the evidence watermark and the text of a mark', () => {
  test('accept names each unmet criterion; with the marks the item is done; the lead cannot accept', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    moveItem(lead, 'submit', 'SHOP-1')
    const error = fails(() => moveItem(owner, 'accept', 'SHOP-1'), Exit.refused, 'AC 1 is not met: [ADD] the export has the right date', /kit eng item ac done SHOP-1 1 --evidence/)
    expect(error.message).toContain('AC 2 is not met')
    fails(() => markCriterion(lead, 'SHOP-1', 1, '', 'run'), Exit.usage, /evidence/)
    markCriterion(lead, 'SHOP-1', 1, 'tests/export.test.sh passes', 'run')
    markCriterion(t.kit(READER), 'SHOP-1', 2, 'seen in the log', 'sourced')
    fails(() => moveItem(lead, 'accept', 'SHOP-1'), Exit.denied, 'accept: only the owner can do this (you are lead)')
    moveItem(owner, 'accept', 'SHOP-1')
    expect(getItem(owner, 'SHOP-1').state).toBe('done')
  })

  test('a reject sets the watermark: the old verify counts no more, a new one does', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.kit(LEAD)
    moveItem(lead, 'submit', 'SHOP-1')
    moveItem(lead, 'reject', 'SHOP-1', { reason: 'wrong date' })
    const item = getItem(lead, 'SHOP-1')
    expect(item.state).toBe('cooking')
    expect(item.evidence_from).toBeGreaterThan(0)
    fails(() => moveItem(lead, 'submit', 'SHOP-1'), Exit.refused, 'the checks have not passed since the last move back')
    verify(lead, 'SHOP-1')
    expect(moveItem(lead, 'submit', 'SHOP-1').item.state).toBe('checking')
  })

  test('a mark compares by text: a changed criterion loses its mark at agree and is named', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    moveItem(lead, 'submit', 'SHOP-1')
    markCriterion(lead, 'SHOP-1', 1, 'the test', 'run')
    markCriterion(lead, 'SHOP-1', 2, 'the log', 'sourced')
    moveItem(lead, 'reframe', 'SHOP-1', { reason: 'the goal moved' })
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ acs: ['[ADD] the export has the right date', '[CHANGE] the error shows the cause'] }))
    const result = moveItem(lead, 'agree', 'SHOP-1')
    expect(result.notes.some(n => n.includes('marks cleared, the text changed: AC 2'))).toBe(true)
    const marks = criteria(owner, 'SHOP-1')
    expect(marks[0]!.done).toBe(true)
    expect(marks[1]!.done).toBe(false)
    expect(history(owner, 'SHOP-1').some(e => e.type === 'ac' && e.reason?.includes('AC 2: the mark was cleared'))).toBe(true)
  })

  test('accept refuses a mark whose text differs from the spec now', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.kit(LEAD)
    moveItem(lead, 'submit', 'SHOP-1')
    markCriterion(lead, 'SHOP-1', 1, 'the test', 'run')
    markCriterion(lead, 'SHOP-1', 2, 'the log', 'sourced')
    lead.db.run("UPDATE criterion SET text = '[CHANGE] something else' WHERE item = 'SHOP-1' AND n = 2")
    fails(() => moveItem(t.kit(OWNER), 'accept', 'SHOP-1'), Exit.refused, 'AC 2 was marked for another text', 'kit eng item ac undo SHOP-1 2')
  })
})

describe('moves back, block, cancel, versions', () => {
  test('every move back needs a reason and clears the approval; block keeps the state before; cancel and restore', () => {
    itemAt(t, 'ready')
    const lead = t.kit(LEAD)
    fails(() => moveItem(lead, 'replan', 'SHOP-1'), Exit.usage, /needs --reason/)
    moveItem(lead, 'block', 'SHOP-1', { reason: 'waits for the API' })
    expect(getItem(lead, 'SHOP-1')).toMatchObject({ state: 'blocked', blocked_from: 'ready', reason: 'waits for the API' })
    moveItem(lead, 'unblock', 'SHOP-1')
    expect(getItem(lead, 'SHOP-1').state).toBe('ready')
    fails(() => moveItem(lead, 'accept', 'SHOP-1'), Exit.denied)
    fails(() => moveItem(t.kit(OWNER), 'accept', 'SHOP-1'), Exit.refused, 'SHOP-1 is ready: accept needs checking', 'kit eng next SHOP-1')
    moveItem(lead, 'cancel', 'SHOP-1', { reason: 'not needed' })
    expect(getItem(lead, 'SHOP-1').state).toBe('cancelled')
    moveItem(lead, 'restore', 'SHOP-1')
    expect(getItem(lead, 'SHOP-1').state).toBe('backlog')
    expect(approvedHashes(lead, 'SHOP-1').size).toBe(0)
  })

  test('--if-version fails with exit 4 when the item moved', () => {
    itemAt(t, 'backlog')
    const lead = t.kit(LEAD)
    const version = getItem(lead, 'SHOP-1').version
    moveItem(lead, 'start', 'SHOP-1', { ifVersion: String(version) })
    fails(() => editItem(lead, 'SHOP-1', 'title', 'x', String(version)), Exit.conflict, /version/)
  })

  test('a reader and a builder cannot move an item or make one', () => {
    itemAt(t, 'backlog')
    fails(() => moveItem(t.kit(READER), 'start', 'SHOP-1'), Exit.denied, 'move: only the owner or the lead can do this (you are reader)')
    fails(() => newItem(t.kit(BUILDER), { id: 'SHOP-2', title: 'x' }), Exit.denied, /item new/)
    fails(() => setMode(t.kit(LEAD), 'SHOP-1', 'auto'), Exit.denied, 'mode: only the owner can do this (you are lead)')
  })
})

describe('E-21 quick', () => {
  test('quick makes a cooking item with one running slice; accept needs an AC and a verify', () => {
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    const item = quickItem(lead, 'SHOP-30', 'bff')
    expect(item).toMatchObject({ state: 'cooking', quick: true, areas: ['bff'] })
    expect(slices(lead, 'SHOP-30')[0]).toMatchObject({ id: 'T1', state: 'running', assignee: 'lead' })
    fails(() => quickItem(lead, 'another quick fix', 'bff'), Exit.refused, 'area bff is in use by SHOP-30')
    const second = quickItem(lead, 'the web title is wrong', 'web')
    expect(second.id).toBe('IT-1')
    expect(second.title).toBe('the web title is wrong')
    moveSlice(lead, 'done', 'SHOP-30', 'T1', { files: ['src/date.ts'] })
    verify(lead, 'SHOP-30')
    moveItem(lead, 'submit', 'SHOP-30')
    fails(() => moveItem(owner, 'accept', 'SHOP-30'), Exit.refused, 'no acceptance criterion', 'kit eng item ac add SHOP-30')
    addCriterion(lead, 'SHOP-30', 'the date is right', 'ADD')
    markCriterion(lead, 'SHOP-30', 1, 'the test', 'run')
    moveItem(owner, 'accept', 'SHOP-30')
    expect(getItem(owner, 'SHOP-30').state).toBe('done')
  })
})

describe('investigate', () => {
  test('questions in place of criteria; findings.md with an answer and evidence for each', () => {
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    newItem(lead, { id: 'SHOP-5', title: 'why does the job retry?', kind: 'investigate', areas: ['bff'] })
    moveItem(lead, 'start', 'SHOP-5')
    expect(readFileSync(join(t.root, 'work', 'SHOP-5', 'spec.md'), 'utf8')).toContain('## Questions')
    writeDoc(t, 'SHOP-5', 'spec.md', SPEC({ kind: 'investigate', questions: [] }).replace('## Questions\n\n\n', '## Questions\n\n'))
    fails(() => moveItem(lead, 'agree', 'SHOP-5'), Exit.refused, /at least one question/)
    writeDoc(t, 'SHOP-5', 'spec.md', SPEC({ kind: 'investigate', questions: ['why does it retry?', 'how often?'] }).replaceAll('SHOP-1', 'SHOP-5'))
    moveItem(lead, 'agree', 'SHOP-5')
    expect(criteria(lead, 'SHOP-5')).toEqual([])
    writeDoc(t, 'SHOP-5', 'plan.md', PLAN)
    moveItem(owner, 'approve', 'SHOP-5')
    t.git('bff', 'switch', '-q', '-c', 'kit/SHOP-5-why')
    moveItem(lead, 'begin', 'SHOP-5')
    fails(() => moveItem(lead, 'submit', 'SHOP-5'), Exit.refused, 'findings.md is not filled', /work\/SHOP-5\/findings.md/)
    writeDoc(t, 'SHOP-5', 'findings.md', '# findings\n\n## Q1\n\n- Answer: a backoff in job.ts:12\n- Evidence: job.ts line 12\n- Open: none\n\n## Q2\n\n- Answer: three times\n- Evidence: \n')
    moveItem(lead, 'submit', 'SHOP-5')
    fails(() => moveItem(owner, 'accept', 'SHOP-5'), Exit.refused, 'Q2 has no answer with evidence in findings.md')
    writeDoc(t, 'SHOP-5', 'findings.md', '# findings\n\n## Q1\n\n- Answer: a backoff\n- Evidence: job.ts line 12\n\n## Q2\n\n- Answer: three times\n- Evidence: config.ts line 3\n')
    moveItem(owner, 'accept', 'SHOP-5')
    expect(getItem(owner, 'SHOP-5').state).toBe('done')
  })
})

describe('E-22 auto and the proceed rule', () => {
  test('proceed passes the approve gate only in an auto run that the owner set', () => {
    itemAt(t, 'planning')
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(lead, 'SHOP-1')
    fails(() => moveItem(lead, 'proceed', 'SHOP-1'), Exit.refused, 'SHOP-1 is not in an auto run that the owner started (mode normal)', 'owner: kit eng item mode SHOP-1 auto')
    fails(() => moveItem(owner, 'proceed', 'SHOP-1'), Exit.denied, 'proceed: only the lead can do this (you are owner)')
    setMode(owner, 'SHOP-1', 'auto')
    // a mode event by another role does not count, even with the mode column at auto
    lead.db.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-1', 'mode', 'auto', 'auto', 'lead', 'lead', '2026-01-01T00:00:00Z')")
    fails(() => moveItem(lead, 'proceed', 'SHOP-1'), Exit.refused, /not in an auto run that the owner started/)
    setMode(owner, 'SHOP-1', 'auto')
    expect(moveItem(lead, 'proceed', 'SHOP-1').item.state).toBe('ready')
    expect(approvedHashes(lead, 'SHOP-1').size).toBe(3)
  })
})
