import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@nook/shared/errors.ts'

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
  const lead = t.eng(LEAD)
  for (const s of lead.stores.slices.list(id).filter(s => s.state !== 'done')) {
    lead.moveSlice('start', id, s.id)
    lead.moveSlice('done', id, s.id, { files: ['src/export.ts', 'tests/export.test.sh'] })
  }
  lead.verify(id)
}

describe('Engineering.moveItem: start, agree and approve', () => {
  test('start scaffolds spec.md from the template with the front matter of the item', () => {
    itemAt(t, 'framing')
    const spec = readFileSync(join(t.root, 'work', 'SHOP-1', 'spec.md'), 'utf8')
    expect(spec).toContain('id: SHOP-1')
    expect(spec).toContain('kind: feature')
    expect(spec).toContain('areas: [bff]')
    expect(t.eng().item('SHOP-1').state).toBe('framing')
  })

  test('start writes the date of today as created and updated of spec.md', () => {
    itemAt(t, 'framing')
    const spec = readFileSync(join(t.root, 'work', 'SHOP-1', 'spec.md'), 'utf8')
    const today = new Date().toISOString().slice(0, 10)
    expect(spec).toContain(`created: ${today}\nupdated: ${today}\n`)
  })

  test('agree scaffolds a plan with a Flow when the spec says size L', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ size: 'L' }))
    t.eng(LEAD).moveItem('agree', 'SHOP-1')
    expect(readFileSync(join(t.root, 'work', 'SHOP-1', 'plan.md'), 'utf8')).toContain('\n## Flow\n')
  })

  test('agree refuses a spec with no updated date and names the fix', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC().replace('updated: 2026-10-15\n', ''))
    fails(() => t.eng(LEAD).moveItem('agree', 'SHOP-1'), Exit.refused, /spec.md: front matter updated is missing/, /write updated: YYYY-MM-DD in the front matter/)
  })

  test('agree lists every gap of the spec with its fix, then copies the front matter and the criteria', () => {
    itemAt(t, 'framing')
    const lead = t.eng(LEAD)
    const error = fails(() => lead.moveItem('agree', 'SHOP-1'), Exit.refused, /no acceptance criterion/, /spec.md/)
    expect(error.message).toContain('fix:')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ areas: ['ghost'], size: 'XL' }))
    const bad = fails(() => lead.moveItem('agree', 'SHOP-1'), Exit.refused)
    expect(bad.message).toContain('area "ghost" is not in nook.yml')
    expect(bad.message).toContain('size must be S, M or L')
    lead.ask('SHOP-1', 'which time zone?', true, 'UTC')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ areas: ['bff', 'web'], size: 'M' }))
    fails(() => lead.moveItem('agree', 'SHOP-1'), Exit.refused, /Q1 is open and blocking/, /nook eng answer SHOP-1 Q1/)
    lead.answer('SHOP-1', 'Q1', 'UTC')
    lead.moveItem('agree', 'SHOP-1')
    const item = lead.item('SHOP-1')
    expect(item.state).toBe('planning')
    expect(item.areas).toEqual(['bff', 'web'])
    expect(item.size).toBe('M')
    expect(lead.stores.criteria.list('SHOP-1').map(c => c.text)).toEqual(['[ADD] the export has the right date', '[CHANGE] the error shows a reason'])
    expect(existsSync(join(t.root, 'work', 'SHOP-1', 'plan.md'))).toBe(true)
    expect(existsSync(join(t.root, 'work', 'SHOP-1', 'tasks.md'))).toBe(true)
  })

  test('approve lists each gap of the plan and the slices, then stores the fingerprints of the three documents', () => {
    itemAt(t, 'planning')
    const owner = t.eng(OWNER)
    const lead = t.eng(LEAD)
    const first = fails(() => owner.moveItem('approve', 'SHOP-1'), Exit.refused)
    expect(first.message).toContain('plan.md is the template, not a plan')
    expect(first.message).toContain('tasks.md: T1: no area')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN.replace(/## Risks\n\nTime zones.\n/, '## Risks\n\n'))
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1', acs: '1', depends: 'T2' }, { id: 'T2', acs: '1', depends: 'T1', area: 'web' }]))
    const second = fails(() => owner.moveItem('approve', 'SHOP-1'), Exit.refused)
    expect(second.message).toContain('plan.md: ## Risks is empty')
    expect(second.message).toContain('tasks.md and the ledger differ: T1, T2')
    expect(second.message).toContain('AC 2 is in no slice')
    expect(second.message).toContain('T2: area web is not an area of SHOP-1')
    expect(second.message).toContain('depends has a cycle: T1 → T2 → T1')
    expect(second.fix).toContain('work/SHOP-1/plan.md')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    lead.importTasks('SHOP-1')
    expect(lead.gaps(lead.item('SHOP-1'), 'approve')).toEqual([])
    owner.moveItem('approve', 'SHOP-1')
    expect(owner.item('SHOP-1').state).toBe('ready')
    const hashes = owner.stores.approvals.hashes('SHOP-1')
    expect([...hashes.keys()].sort()).toEqual(['plan.md', 'spec.md', 'tasks.md'])
    expect(hashes.get('spec.md')).toMatch(/^[0-9a-f]{64}$/)
  })

  test('approve by the lead or a builder exits 5 and names the role', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    t.eng(LEAD).importTasks('SHOP-1')
    fails(() => t.eng(LEAD).moveItem('approve', 'SHOP-1'), Exit.denied, 'approve: only the owner can do this (you are lead)')
    fails(() => t.eng(BUILDER).moveItem('approve', 'SHOP-1'), Exit.denied, /you are builder/)
    expect(t.eng().item('SHOP-1').state).toBe('planning')
  })

  test('approve through the nook binary exits 5 when CLAUDECODE is set, and passes in the owner terminal', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    t.eng(LEAD).importTasks('SHOP-1')
    const bin = join(import.meta.dir, '..', '..', '..', 'apps', 'nook', 'bin', 'nook')
    const env: Record<string, string | undefined> = { ...process.env }
    delete env.NOOK_ROLE
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

describe('Engineering.moveItem: begin and submit', () => {
  test('begin refuses a plan that changed after the approve, and replan clears the approval', () => {
    itemAt(t, 'ready')
    const plan = join(t.root, 'work', 'SHOP-1', 'plan.md')
    writeFileSync(plan, `${readFileSync(plan, 'utf8')}\nmore\n`)
    t.git('bff', 'switch', '-q', '-c', 'nook/SHOP-1-work')
    const error = fails(() => t.eng(LEAD).moveItem('begin', 'SHOP-1'), Exit.refused, 'plan.md changed after the approve', 'nook eng item replan SHOP-1')
    expect(error.message).not.toContain('spec.md changed')
    t.eng(LEAD).moveItem('replan', 'SHOP-1', { reason: 'the plan changed' })
    expect(t.eng().stores.approvals.hashes('SHOP-1').size).toBe(0)
    expect(t.eng().item('SHOP-1').state).toBe('planning')
  })

  test('begin needs a non-protected branch in each git area', () => {
    itemAt(t, 'ready')
    fails(() => t.eng(LEAD).moveItem('begin', 'SHOP-1'), Exit.refused, 'area bff is on main, a protected branch', 'nook eng item branch SHOP-1')
  })

  test('begin refuses an area that another item cooks in', () => {
    itemAt(t, 'cooking')
    itemAt(t, 'ready', 'SHOP-14')
    fails(() => t.eng(LEAD).moveItem('begin', 'SHOP-14'), Exit.refused, 'area bff is in use by SHOP-1', /wait for SHOP-1/)
  })

  test('submit needs every slice done, a passing verify, and warns on a weak proof', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    const none = fails(() => lead.moveItem('submit', 'SHOP-1'), Exit.refused)
    expect(none.message).toContain('no slice is done')
    expect(none.message).toContain('T1 is todo')
    expect(none.message).toContain('the checks have not passed')
    expect(none.fix).toContain('nook eng task done SHOP-1')
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['src/a.ts'] })
    t.fail('bff', true)
    lead.verify('SHOP-1')
    fails(() => lead.moveItem('submit', 'SHOP-1'), Exit.refused, 'the checks have not passed since the last move back', 'nook eng item verify SHOP-1')
    t.fail('bff', false)
    lead.verify('SHOP-1')
    const result = lead.moveItem('submit', 'SHOP-1')
    expect(result.item.state).toBe('review')
    expect(result.warnings[0]).toContain('T1 is done with proof none')
  })

  test('the slices and the criteria freeze from ready on: exit 3 and "replan first"', () => {
    itemAt(t, 'ready')
    const lead = t.eng(LEAD)
    fails(() => lead.importTasks('SHOP-1'), Exit.refused, /frozen after the approve/, /replan first: nook eng item replan SHOP-1/)
    fails(() => lead.addCriterion('SHOP-1', 'another'), Exit.refused, /frozen/, 'nook eng item replan SHOP-1')
    fails(() => lead.editItem('SHOP-1', 'areas', 'web'), Exit.refused, /frozen/, 'nook eng item replan SHOP-1')
    lead.editItem('SHOP-1', 'title', 'a new title')
  })
})

describe('Engineering.moveItem: accept and the evidence watermark', () => {
  test('accept names each unmet criterion; with the marks the item is done; the lead cannot accept', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.eng(LEAD)
    const owner = t.eng(OWNER)
    lead.moveItem('submit', 'SHOP-1')
    const error = fails(() => owner.moveItem('accept', 'SHOP-1'), Exit.refused, 'AC 1 is not met: [ADD] the export has the right date', /nook eng item ac done SHOP-1 1 --evidence/)
    expect(error.message).toContain('AC 2 is not met')
    fails(() => lead.markCriterion('SHOP-1', 1, '', 'run'), Exit.usage, /evidence/)
    lead.markCriterion('SHOP-1', 1, 'tests/export.test.sh passes', 'run')
    t.eng(READER).markCriterion('SHOP-1', 2, 'seen in the log', 'sourced')
    fails(() => lead.moveItem('accept', 'SHOP-1'), Exit.denied, 'accept: only the owner can do this (you are lead)')
    owner.moveItem('accept', 'SHOP-1')
    expect(owner.item('SHOP-1').state).toBe('done')
  })

  test('a reject sets the watermark: the old verify counts no more, a new one does', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.eng(LEAD)
    lead.moveItem('submit', 'SHOP-1')
    lead.moveItem('reject', 'SHOP-1', { reason: 'wrong date' })
    const item = lead.item('SHOP-1')
    expect(item.state).toBe('cooking')
    expect(item.evidence_from).toBeGreaterThan(0)
    fails(() => lead.moveItem('submit', 'SHOP-1'), Exit.refused, 'the checks have not passed since the last move back')
    lead.verify('SHOP-1')
    expect(lead.moveItem('submit', 'SHOP-1').item.state).toBe('review')
  })

  test('a mark compares by text: a changed criterion loses its mark at agree and is named', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.eng(LEAD)
    const owner = t.eng(OWNER)
    lead.moveItem('submit', 'SHOP-1')
    lead.markCriterion('SHOP-1', 1, 'the test', 'run')
    lead.markCriterion('SHOP-1', 2, 'the log', 'sourced')
    lead.moveItem('reframe', 'SHOP-1', { reason: 'the goal moved' })
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ acs: ['[ADD] the export has the right date', '[CHANGE] the error shows the cause'] }))
    const result = lead.moveItem('agree', 'SHOP-1')
    expect(result.notes.some(n => n.includes('marks cleared, the text changed: AC 2'))).toBe(true)
    const marks = owner.stores.criteria.list('SHOP-1')
    expect(marks[0]!.done).toBe(true)
    expect(marks[1]!.done).toBe(false)
    expect(owner.stores.events.history('SHOP-1').some(e => e.type === 'ac' && e.reason?.includes('AC 2: the mark was cleared'))).toBe(true)
  })

  test('accept refuses a mark whose text differs from the spec now', () => {
    itemAt(t, 'cooking')
    buildAll()
    const lead = t.eng(LEAD)
    lead.moveItem('submit', 'SHOP-1')
    lead.markCriterion('SHOP-1', 1, 'the test', 'run')
    lead.markCriterion('SHOP-1', 2, 'the log', 'sourced')
    lead.ledger.run("UPDATE criterion SET text = '[CHANGE] something else' WHERE item = 'SHOP-1' AND n = 2")
    fails(() => t.eng(OWNER).moveItem('accept', 'SHOP-1'), Exit.refused, 'AC 2 was marked for another text', 'nook eng item ac undo SHOP-1 2')
  })
})

describe('Engineering.moveItem: the moves back, block, cancel and versions', () => {
  test('every move back needs a reason and clears the approval; block keeps the state before; cancel and restore', () => {
    itemAt(t, 'ready')
    const lead = t.eng(LEAD)
    fails(() => lead.moveItem('replan', 'SHOP-1'), Exit.usage, /needs --reason/)
    lead.moveItem('block', 'SHOP-1', { reason: 'waits for the API' })
    expect(lead.item('SHOP-1')).toMatchObject({ state: 'blocked', blocked_from: 'ready', reason: 'waits for the API' })
    lead.moveItem('unblock', 'SHOP-1')
    expect(lead.item('SHOP-1').state).toBe('ready')
    fails(() => lead.moveItem('accept', 'SHOP-1'), Exit.denied)
    fails(() => t.eng(OWNER).moveItem('accept', 'SHOP-1'), Exit.refused, 'SHOP-1 is ready: accept needs review', 'nook eng next SHOP-1')
    lead.moveItem('cancel', 'SHOP-1', { reason: 'not needed' })
    expect(lead.item('SHOP-1').state).toBe('cancelled')
    lead.moveItem('restore', 'SHOP-1')
    expect(lead.item('SHOP-1').state).toBe('backlog')
    expect(lead.stores.approvals.hashes('SHOP-1').size).toBe(0)
  })

  test('--if-version fails with exit 4 when the item moved', () => {
    itemAt(t, 'backlog')
    const lead = t.eng(LEAD)
    const version = lead.item('SHOP-1').version
    lead.moveItem('start', 'SHOP-1', { ifVersion: String(version) })
    fails(() => lead.editItem('SHOP-1', 'title', 'x', String(version)), Exit.conflict, /version/)
  })

  test('a reader and a builder cannot move an item or make one', () => {
    itemAt(t, 'backlog')
    fails(() => t.eng(READER).moveItem('start', 'SHOP-1'), Exit.denied, 'move: only the owner or the lead can do this (you are reader)')
    fails(() => t.eng(BUILDER).newItem({ id: 'SHOP-2', title: 'x' }), Exit.denied, /item new/)
    fails(() => t.eng(LEAD).setMode('SHOP-1', 'yolo'), Exit.denied, 'mode: only the owner can do this (you are lead)')
  })
})

describe('Engineering.quick', () => {
  test('quick makes a cooking item with one running slice; accept needs an AC and a verify', () => {
    const lead = t.eng(LEAD)
    const owner = t.eng(OWNER)
    const item = lead.quick('SHOP-30', 'bff')
    expect(item).toMatchObject({ state: 'cooking', quick: true, areas: ['bff'] })
    expect(lead.stores.slices.list('SHOP-30')[0]).toMatchObject({ id: 'T1', state: 'running', assignee: 'lead' })
    fails(() => lead.quick('another quick fix', 'bff'), Exit.refused, 'area bff is in use by SHOP-30')
    const second = lead.quick('the web title is wrong', 'web')
    expect(second.id).toBe('IT-001')
    expect(second.title).toBe('the web title is wrong')
    lead.moveSlice('done', 'SHOP-30', 'T1', { files: ['src/date.ts'] })
    lead.verify('SHOP-30')
    lead.moveItem('submit', 'SHOP-30')
    fails(() => owner.moveItem('accept', 'SHOP-30'), Exit.refused, 'no acceptance criterion', 'nook eng item ac add SHOP-30')
    lead.addCriterion('SHOP-30', 'the date is right', 'ADD')
    lead.markCriterion('SHOP-30', 1, 'the test', 'run')
    owner.moveItem('accept', 'SHOP-30')
    expect(owner.item('SHOP-30').state).toBe('done')
  })
})

describe('Engineering.moveItem on an investigation', () => {
  test('questions in place of criteria; findings.md with an answer and evidence for each', () => {
    const lead = t.eng(LEAD)
    const owner = t.eng(OWNER)
    lead.newItem({ id: 'SHOP-5', title: 'why does the job retry?', kind: 'investigate', areas: ['bff'] })
    lead.moveItem('start', 'SHOP-5')
    expect(readFileSync(join(t.root, 'work', 'SHOP-5', 'spec.md'), 'utf8')).toContain('## Questions')
    writeDoc(t, 'SHOP-5', 'spec.md', SPEC({ kind: 'investigate', questions: [] }).replace('## Questions\n\n\n', '## Questions\n\n'))
    fails(() => lead.moveItem('agree', 'SHOP-5'), Exit.refused, /at least one question/)
    writeDoc(t, 'SHOP-5', 'spec.md', SPEC({ kind: 'investigate', questions: ['why does it retry?', 'how often?'] }).replaceAll('SHOP-1', 'SHOP-5'))
    lead.moveItem('agree', 'SHOP-5')
    expect(lead.stores.criteria.list('SHOP-5')).toEqual([])
    writeDoc(t, 'SHOP-5', 'plan.md', PLAN)
    owner.moveItem('approve', 'SHOP-5')
    t.git('bff', 'switch', '-q', '-c', 'nook/SHOP-5-why')
    lead.moveItem('begin', 'SHOP-5')
    fails(() => lead.moveItem('submit', 'SHOP-5'), Exit.refused, 'findings.md is not filled', /work\/SHOP-5\/findings.md/)
    writeDoc(t, 'SHOP-5', 'findings.md', '# findings\n\n## Q1\n\n- Answer: a backoff in job.ts:12\n- Evidence: job.ts line 12\n- Open: none\n\n## Q2\n\n- Answer: three times\n- Evidence: \n')
    lead.moveItem('submit', 'SHOP-5')
    fails(() => owner.moveItem('accept', 'SHOP-5'), Exit.refused, 'Q2 has no answer with evidence in findings.md')
    writeDoc(t, 'SHOP-5', 'findings.md', '# findings\n\n## Q1\n\n- Answer: a backoff\n- Evidence: job.ts line 12\n\n## Q2\n\n- Answer: three times\n- Evidence: config.ts line 3\n')
    owner.moveItem('accept', 'SHOP-5')
    expect(owner.item('SHOP-5').state).toBe('done')
  })
})

describe('Engineering.moveItem: proceed', () => {
  test('proceed passes the approve gate only in a yolo run that the owner set', () => {
    itemAt(t, 'planning')
    const lead = t.eng(LEAD)
    const owner = t.eng(OWNER)
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    lead.importTasks('SHOP-1')
    fails(() => lead.moveItem('proceed', 'SHOP-1'), Exit.refused, 'SHOP-1 is not in a yolo run that the owner started (mode normal)', 'owner: /gate mode SHOP-1 yolo')
    fails(() => owner.moveItem('proceed', 'SHOP-1'), Exit.denied, 'proceed: only the lead can do this (you are owner)')
    owner.setMode('SHOP-1', 'yolo')
    // a mode event by another role does not count, even with the mode column at yolo
    lead.ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-1', 'mode', 'yolo', 'yolo', 'lead', 'lead', '2026-01-01T00:00:00Z')")
    fails(() => lead.moveItem('proceed', 'SHOP-1'), Exit.refused, /not in a yolo run that the owner started/)
    owner.setMode('SHOP-1', 'yolo')
    expect(lead.moveItem('proceed', 'SHOP-1').item.state).toBe('ready')
    expect(lead.stores.approvals.hashes('SHOP-1').size).toBe(3)
  })
})

describe('Engineering.archive', () => {
  test('moves the ticket folder to backlog/archive/', () => {
    itemAt(t, 'backlog')
    mkdirSync(join(t.root, 'backlog', 'SHOP-1'), { recursive: true })
    writeFileSync(join(t.root, 'backlog', 'SHOP-1', 'ticket.md'), '# SHOP-1\n')
    expect(t.eng(LEAD).archive('SHOP-1')).toBe(join(t.root, 'backlog', 'archive', 'SHOP-1'))
    expect(existsSync(join(t.root, 'backlog', 'archive', 'SHOP-1', 'ticket.md'))).toBe(true)
  })

  test('an item with no ticket folder, as a quick fix, has nothing to archive and is not refused', () => {
    itemAt(t, 'backlog')
    expect(t.eng(LEAD).archive('SHOP-1')).toBeNull()
  })

  test('reopen brings the archived ticket folder back, so the spec reads the ticket again', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    mkdirSync(join(t.root, 'backlog', 'SHOP-1'), { recursive: true })
    writeFileSync(join(t.root, 'backlog', 'SHOP-1', 'ticket.md'), '# SHOP-1\n')
    lead.archive('SHOP-1')
    lead.ledger.run("UPDATE item SET state = 'done' WHERE id = 'SHOP-1'")
    const result = lead.moveItem('reopen', 'SHOP-1', { reason: 'a gap of the page' })
    expect(readFileSync(join(t.root, 'backlog', 'SHOP-1', 'ticket.md'), 'utf8')).toBe('# SHOP-1\n')
    expect(existsSync(join(t.root, 'backlog', 'archive', 'SHOP-1'))).toBe(false)
    expect(result.notes).toContain('the ticket is back in backlog/SHOP-1/')
  })
})

describe('Engineering.moveItem: reopen ends a yolo run', () => {
  test('a reopened item is back in mode normal: the yolo run ended at the accept', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    t.eng(OWNER).setMode('SHOP-1', 'yolo')
    lead.ledger.run("UPDATE item SET state = 'done' WHERE id = 'SHOP-1'")
    lead.moveItem('reopen', 'SHOP-1', { reason: 'a gap of the page' })
    expect([lead.item('SHOP-1').state, lead.item('SHOP-1').mode]).toEqual(['cooking', 'normal'])
  })

  test('a reject inside a yolo run keeps the mode yolo', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    t.eng(OWNER).setMode('SHOP-1', 'yolo')
    lead.ledger.run("UPDATE item SET state = 'review' WHERE id = 'SHOP-1'")
    lead.moveItem('reject', 'SHOP-1', { reason: 'AC 1 not met' })
    expect(lead.item('SHOP-1').mode).toBe('yolo')
  })
})
