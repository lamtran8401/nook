import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { answeredQuestions, emptySections, isFilled, parseSpec } from '../src/docs/spec.ts'
import { readConfig } from '../src/home.ts'
import { adrs, newAdr, setAdrStatus } from '../src/model/adr.ts'
import { verify } from '../src/model/checks.ts'
import { markCriterion } from '../src/model/criteria.ts'
import { addNote, newItem, notes, setMode } from '../src/model/items.ts'
import { moveItem } from '../src/model/moves.ts'
import { answer, ask } from '../src/model/questions.ts'
import { importTasks, moveSlice } from '../src/model/slices.ts'
import { areaStatus, brief, doctor, formatNext, itemBrief, next, pickup, taskBrief } from '../src/report.ts'
import { BUILDER, itemAt, LEAD, makeHome, OWNER, PLAN, READER, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('the spec parser', () => {
  test('front matter, sections, AC lines with their tags, areas as a list or a comma list, problems', () => {
    const spec = parseSpec(SPEC({ areas: ['bff', 'web'] }))
    expect(spec).toMatchObject({ kind: 'feature', size: 'S', areas: ['bff', 'web'], intent: 'Fix the export date.', problems: [] })
    expect(spec.criteria.map(c => [c.n, c.tag, c.text])).toEqual([[1, 'ADD', '[ADD] the export has the right date'], [2, 'CHANGE', '[CHANGE] the error shows a reason']])
    expect(parseSpec(SPEC().replace('areas: [bff]', 'areas: bff, web')).areas).toEqual(['bff', 'web'])
    expect(parseSpec(SPEC().replace('areas: [bff]', 'areas:\n  - bff\n  - web')).areas).toEqual(['bff', 'web'])
    const bad = parseSpec('# no front matter\n\n## Acceptance criteria\n\n- the date is right\n- [FIX] x\n')
    expect(bad.problems).toContain('no front matter: start the file with --- id, kind, size, areas ---')
    expect(bad.problems).toContain('front matter: kind is missing')
    expect(bad.problems).toContain('write the Intent')
    expect(bad.problems.some(p => p.includes('"- the date is right" is not a'))).toBe(true)
    expect(bad.criteria).toEqual([])
    expect(parseSpec(SPEC({ kind: 'investigate', questions: ['why?', 'how?'] })).questions).toEqual(['why?', 'how?'])
  })

  test('filled, empty sections and answered questions', () => {
    expect(isFilled('---\nid: x\n---\n# t\n\n## A\n\n<!-- guidance -->\n')).toBe(false)
    expect(isFilled('# t\n\n## A\n\ntext\n')).toBe(true)
    expect(emptySections(PLAN.replace('Time zones.\n', ''), ['Architecture', 'Risks'])).toEqual(['Risks'])
    expect([...answeredQuestions('## Q1\n\n- Answer: a\n- Evidence: b\n\n## Q2\n\n**Answer**: a\nEvidence:\n\n## Q3\nAnswer: x\nEvidence: y\n')]).toEqual([1, 3])
  })
})

describe('the config', () => {
  test('reads the section with defaults and names each fault with its fix', () => {
    const config = readConfig(t.root)
    expect(config.protected).toEqual(['main', 'master'])
    expect(config.areas.map(a => [a.name, a.kind, a.git, a.checks])).toEqual([['bff', 'backend', true, ['sh test.sh']], ['web', 'frontend', true, ['sh test.sh']]])
    expect(config.tracker).toEqual({ type: 'none' })
    const file = join(t.root, 'kit.yml')
    const faults: [string, RegExp][] = [
      ['engineering:\n  areas:\n    - { name: bff, path: p }\n', /kind must be one of frontend, backend, docs, data, tool/],
      ['engineering:\n  areas:\n    - { path: p, kind: docs }\n', /has no name/],
      ['engineering:\n  areas:\n    - { name: a, kind: docs }\n', /area a has no path/],
      ['engineering:\n  areas:\n    - { name: a, path: p, kind: docs }\n    - { name: a, path: q, kind: docs }\n', /two areas are named a/],
      ['engineering:\n  protected: main\n', /protected must be a list/],
      ['engineering:\n  tracker: { type: trello }\n', /none, jira or github/],
      ['engineering: [a]\n', /engineering must be a map/],
    ]
    for (const [section, pattern] of faults) {
      writeFileSync(file, `packs: [engineering]\n${section}`)
      let error: EvError | undefined
      try {
        readConfig(t.root)
      } catch (e) {
        error = e as EvError
      }
      expect(error?.message).toMatch(pattern)
      expect(error?.code).toBe(Exit.usage)
      expect(error?.fix).toBeTruthy()
    }
    writeFileSync(file, 'packs: [engineering]\n')
    expect(readConfig(t.root)).toMatchObject({ missing: true, areas: [], dir: 'work' })
  })
})

describe('next', () => {
  test('names the skill for each state, the owner steps first, and starts with what waits for you', () => {
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    newItem(lead, { id: 'SHOP-2', title: 'b', areas: ['web'] })
    itemAt(t, 'planning')
    expect(next(lead, 'SHOP-2')[0]!.skill).toBe('/spec SHOP-2')
    expect(next(lead, 'SHOP-1')[0]).toMatchObject({ skill: '/recipe SHOP-1', owner: false })
    expect(formatNext(next(lead))).toMatch(/^Nothing waits for you\./)
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(lead, 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]).toMatchObject({ skill: 'owner: kit eng item approve SHOP-1', owner: true })
    const text = formatNext(next(lead))
    expect(text.split('\n')[0]).toBe('Waits for you: SHOP-1: kit eng item approve SHOP-1')
    expect(text.split('\n')[1]).toMatch(/^SHOP-1 {5}planning {2}owner: kit eng item approve SHOP-1/)
    moveItem(owner, 'approve', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('/cook SHOP-1')
    t.git('bff', 'switch', '-q', '-c', 'kit/SHOP-1-x')
    moveItem(lead, 'begin', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]).toMatchObject({ skill: '/cook SHOP-1', detail: '0/1 slices done, 0 running, 1 ready' })
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    moveSlice(lead, 'done', 'SHOP-1', 'T1', { files: ['a'] })
    verify(lead, 'SHOP-1')
    moveItem(lead, 'submit', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('/check SHOP-1')
    markCriterion(lead, 'SHOP-1', 1, 'x', 'run')
    markCriterion(lead, 'SHOP-1', 2, 'y', 'judged')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('owner: kit eng item accept SHOP-1')
    moveItem(owner, 'accept', 'SHOP-1')
    expect(next(lead, 'SHOP-1')[0]!.skill).toBe('/close SHOP-1')
    ask(lead, 'SHOP-2', 'what?', true)
    expect(next(lead, 'SHOP-2')[0]).toMatchObject({ owner: true })
    expect(next(lead, 'SHOP-2')[0]!.skill).toContain('kit eng answer SHOP-2 Q1')
    answer(lead, 'SHOP-2', 'Q1', 'this')
    moveItem(lead, 'block', 'SHOP-2', { reason: 'waits' })
    expect(next(lead, 'SHOP-2')[0]!.skill).toContain('unblock SHOP-2')
  })
})

describe('item brief, task brief, pickup', () => {
  test('the brief holds the state, the next step, the areas, the criteria, the slices and stays under 1800 characters', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS(Array.from({ length: 30 }, (_, i) => ({ id: `T${i + 1}`, title: `a long slice title number ${i + 1} that goes on and on for a while` }))))
    const lead = t.kit(LEAD)
    ask(lead, 'SHOP-1', 'which zone?', false, 'UTC')
    const text = itemBrief(lead, 'SHOP-1')
    expect(text.length).toBeLessThanOrEqual(1800)
    expect(text).toContain('state: cooking  mode: normal')
    expect(text).toContain('next: /cook SHOP-1')
    expect(text).toContain('bff → projects/bff (backend)')
    expect(text).toContain('[ ] 1 [ADD] the export has the right date')
    expect(text).toContain('T1 todo bff')
    expect(text).toContain('… and')
    expect(text).toContain('Q1 which zone? → rec: UTC')
    const slice = taskBrief(lead, 'SHOP-1', 'T1')
    expect(slice).toContain(`area: bff → ${t.area('bff')} (backend); test: sh test.sh {files}`)
    expect(slice).toContain('1 [ADD] the export has the right date')
    expect(slice).toContain('kit eng task prove SHOP-1 T1')
  })

  test('pickup records the session and prints the brief plus handoff.md', () => {
    itemAt(t, 'framing')
    const lead = t.kit(LEAD)
    writeDoc(t, 'SHOP-1', 'handoff.md', '# handoff\n\n## Next\n\nwrite the spec\n')
    const out = pickup(lead, 'SHOP-1')
    expect(out).toContain('SHOP-1 — the export date is off')
    expect(out).toContain('--- handoff.md ---')
    expect(out).toContain('write the spec')
    expect(lead.db.query('SELECT item, role FROM session WHERE id = ?').get('sess-1')).toEqual({ item: 'SHOP-1', role: 'lead' })
    expect(() => pickup(t.kit(READER), 'SHOP-1')).toThrow(/pickup/)
  })
})

describe('brief and doctor', () => {
  test('brief: the owner steps are now, failed slices and stale cooking are today', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.kit(LEAD)
    newItem(lead, { id: 'SHOP-2', title: 'b', areas: ['web'] })
    ask(lead, 'SHOP-2', 'what?', true)
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    moveSlice(lead, 'fail', 'SHOP-1', 'T1', { reason: 'cannot' })
    lead.db.run("UPDATE item SET updated = '2026-01-01T00:00:00.000Z' WHERE id = 'SHOP-1'")
    const lines = brief(lead)
    expect(lines.every(l => l.pack === 'engineering' && l.text && l.action && l.ref)).toBe(true)
    expect(lines.map(l => [l.urgency, l.ref])).toEqual([['today', 'SHOP-1'], ['today', 'SHOP-1'], ['now', 'SHOP-2']])
    expect(lines[0]!.text).toContain('T1 failed: cannot')
    expect(lines[2]!.action).toBe('kit eng answer SHOP-2 Q1 "<answer>"')
    itemAt(t, 'planning', 'SHOP-3')
    writeDoc(t, 'SHOP-3', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-3', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(lead, 'SHOP-3')
    expect(brief(lead).find(l => l.ref === 'SHOP-3')).toMatchObject({ urgency: 'now', action: 'kit eng item approve SHOP-3' })
  })

  test('doctor: the gaps of the pack with their fixes', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    lead.db.run("UPDATE item SET areas = '[\"bff\",\"ghost\"]' WHERE id = 'SHOP-1'")
    newItem(lead, { id: 'SHOP-2', title: 'b', areas: ['bff'], state: 'cooking' })
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    moveSlice(lead, 'wait', 'SHOP-1', 'T1', { reason: 'the schema' })
    const plan = join(t.root, 'work', 'SHOP-1', 'plan.md')
    writeFileSync(plan, `${readFileSync(plan, 'utf8')}\nchanged\n`)
    ask(lead, 'SHOP-2', 'what?', true)
    lead.db.run("UPDATE question SET asked_at = '2026-01-01T00:00:00.000Z'")
    const found = doctor(lead)
    const texts = found.map(f => f.text)
    expect(texts).toContain('SHOP-1 names an area that kit.yml does not have: ghost')
    expect(texts).toContain('SHOP-1: plan.md changed after the approve')
    expect(texts).toContain('SHOP-1 T1 is waiting: the schema')
    expect(texts).toContain('SHOP-2 is cooking with no slice')
    expect(texts).toContain('two items cook in area bff: SHOP-1, SHOP-2')
    expect(texts).toContain('SHOP-2 Q1 has blocked for more than a day: what?')
    expect(texts).toContain('backlog/ is missing')
    expect(found.every(f => f.fix && f.where && ['error', 'warn'].includes(f.level))).toBe(true)
    const bare = makeHome({ section: false })
    try {
      expect(doctor(bare.kit()).map(f => f.text)[0]).toContain('no engineering section')
    } finally {
      bare.cleanup()
    }
  })

  test('area status, notes, mode and adr', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    writeFileSync(join(t.area('bff'), 'dirty.txt'), 'x')
    const status = areaStatus(lead)
    expect(status[0]).toMatchObject({ area: 'bff', branch: 'kit/SHOP-1-work', dirty: 1, item: 'SHOP-1', exists: true })
    expect(status[1]).toMatchObject({ area: 'web', branch: 'main', dirty: 0, item: null })
    addNote(t.kit(BUILDER), 'SHOP-1', 'a note')
    expect(notes(lead, 'SHOP-1')[0]).toMatchObject({ text: 'a note', by: 'backend-builder-ab12' })
    expect(() => addNote(t.kit(READER), 'SHOP-1', 'x')).toThrow(/note add/)
    expect(setMode(t.kit(OWNER), 'SHOP-1', 'auto')).toMatchObject({ mode: 'auto', mode_by: 'owner' })
    const adr = newAdr(lead, 'Use UTC for export dates', 'SHOP-1')
    expect(adr).toMatchObject({ n: 1, status: 'proposed', item: 'SHOP-1', title: 'Use UTC for export dates' })
    expect(existsSync(join(t.root, 'docs', 'adr', '0001-use-utc-for-export-dates.md'))).toBe(true)
    const second = newAdr(lead, 'Use local time')
    expect(setAdrStatus(lead, 1, 'accepted').status).toBe('accepted')
    expect(setAdrStatus(lead, 1, 'superseded', second.n)).toMatchObject({ status: 'superseded', by: 2 })
    expect(adrs(lead).map(a => a.status)).toEqual(['superseded', 'proposed'])
    expect(() => newAdr(t.kit(READER), 'x')).toThrow(/adr/)
  })
})
