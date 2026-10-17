import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

import { AreaFree, BranchNotProtected, EachArea } from '../src/guards/areas.ts'
import { AutoByOwner } from '../src/guards/yolo.ts'
import { CriteriaMarked } from '../src/guards/criteria.ts'
import { DatesWritten } from '../src/guards/dates.ts'
import { FindingsFilled, QuestionsAnswered } from '../src/guards/findings.ts'
import { FingerprintsUnchanged } from '../src/guards/fingerprints.ts'
import { GuardContext } from '../src/guards/guard.ts'
import { PlanFilled } from '../src/guards/plan.ts'
import { NoOpenBlockingQuestion } from '../src/guards/questions.ts'
import { EveryAcInSlice, NoDependsCycle, SliceAreasOfItem, SlicesDone, SlicesImported } from '../src/guards/slices.ts'
import { SpecParses } from '../src/guards/spec.ts'
import { GUARDS } from '../src/guards/table.ts'
import { VerifyPassed } from '../src/guards/verify.ts'
import { itemAt, LEAD, makeHome, OWNER, PLAN, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const ctx = (id = 'SHOP-1') => {
  const eng = t.eng(LEAD)
  return new GuardContext(t.home, eng.stores, eng.item(id))
}
const doc = (name: string, id = 'SHOP-1') => join(t.root, 'work', id, name)

/** An item in planning with a filled plan and the slices of `tasks` imported. */
const planned = (tasks = TASKS([{ id: 'T1' }])) => {
  itemAt(t, 'planning')
  writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
  writeDoc(t, 'SHOP-1', 'tasks.md', tasks)
}

/** An item in cooking whose one slice T1 is done. */
const built = () => {
  itemAt(t, 'cooking')
  const lead = t.eng(LEAD)
  lead.moveSlice('start', 'SHOP-1', 'T1')
  lead.moveSlice('done', 'SHOP-1', 'T1', { files: ['a.ts'] })
}

describe('SpecParses', () => {
  test('a missing spec.md is one gap whose fix is the start move', () => {
    itemAt(t, 'framing')
    rmSync(doc('spec.md'))
    expect(new SpecParses().check(ctx())).toEqual([{ text: 'spec.md is missing', fix: 'nook eng item start SHOP-1 scaffolds it' }])
  })

  test('an area that nook.yml does not have is a gap that names the spec', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ areas: ['ghost'] }))
    expect(new SpecParses().check(ctx())).toEqual([
      { text: 'spec.md: area "ghost" is not in nook.yml', fix: `fix the name in ${doc('spec.md')}, or add the area with /setup` },
    ])
  })

  test('an investigation needs a question, not a criterion', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ kind: 'investigate', questions: [] }))
    expect(new SpecParses().check(ctx())).toEqual([
      { text: 'spec.md: an investigate item needs at least one question under ## Questions', fix: `edit ${doc('spec.md')}` },
    ])
  })

  test('a filled spec has no gap', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    expect(new SpecParses().check(ctx())).toEqual([])
  })
})

describe('NoOpenBlockingQuestion', () => {
  test('an open blocking question is a gap whose fix answers it', () => {
    itemAt(t, 'framing')
    t.eng(LEAD).ask('SHOP-1', 'which zone?', true)
    expect(new NoOpenBlockingQuestion().check(ctx())).toEqual([{ text: 'Q1 is open and blocking: which zone?', fix: 'ask the owner, then nook eng answer SHOP-1 Q1 "<answer>"' }])
  })

  test('a question that does not block is no gap', () => {
    itemAt(t, 'framing')
    t.eng(LEAD).ask('SHOP-1', 'which zone?', false)
    expect(new NoOpenBlockingQuestion().check(ctx())).toEqual([])
  })
})

describe('PlanFilled', () => {
  test('the template is a gap that names the sections to write', () => {
    itemAt(t, 'planning')
    expect(new PlanFilled().check(ctx())).toEqual([{ text: 'plan.md is the template, not a plan', fix: `write the sections Today, Approach, Impact, Proof, Risks of ${doc('plan.md')}` }])
  })

  test('each empty section is a gap of its own', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', '## Today\n\nfacts\n\n## Approach\n\n## Impact\n\nNone: all.\n\n## Proof\n\n## Risks\n\nnone\n')
    expect(new PlanFilled().check(ctx())).toEqual([
      { text: 'plan.md: ## Approach is empty', fix: `write the Approach in ${doc('plan.md')}` },
      { text: 'plan.md: ## Proof is empty', fix: `write the Proof in ${doc('plan.md')}` },
    ])
  })

  test('a section with a comment and a mermaid block is filled', () => {
    itemAt(t, 'planning')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN.replace('The export formats the date in the zone of the server.', '<!-- one diagram -->\n```mermaid\nflowchart TB\n  a --> b\n```'))
    expect(new PlanFilled().check(ctx())).toEqual([])
  })

  test('a plan of size L without a Flow is a gap', () => {
    itemAt(t, 'planning')
    t.eng(LEAD).editItem('SHOP-1', 'size', 'L')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    expect(new PlanFilled().check(ctx())).toEqual([{ text: 'plan.md: ## Flow is empty', fix: `write the Flow in ${doc('plan.md')}` }])
  })

  test('a plan of size L with a Flow has no gap', () => {
    itemAt(t, 'planning')
    t.eng(LEAD).editItem('SHOP-1', 'size', 'L')
    writeDoc(t, 'SHOP-1', 'plan.md', `${PLAN}\n## Flow\n\n\`\`\`mermaid\nsequenceDiagram\n  a->>b: export\n\`\`\`\n`)
    expect(new PlanFilled().check(ctx())).toEqual([])
  })
})

describe('DatesWritten', () => {
  test('a spec with both dates has no gap', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    expect(new DatesWritten(['spec.md']).check(ctx())).toEqual([])
  })

  test('a missing updated is a gap whose fix names the field and the file', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC().replace('updated: 2026-10-15\n', ''))
    expect(new DatesWritten(['spec.md']).check(ctx())).toEqual([
      { text: 'spec.md: front matter updated is missing', fix: `write updated: YYYY-MM-DD in the front matter of ${doc('spec.md')}` },
    ])
  })

  test('a created that is not a real date is a gap', () => {
    itemAt(t, 'framing')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC().replace('created: 2026-10-14', 'created: 2026-02-30'))
    expect(new DatesWritten(['spec.md']).check(ctx()).map(g => g.text)).toEqual(['spec.md: front matter created is not a date'])
  })

  test('the dates of plan.md and tasks.md are each checked', () => {
    planned()
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN.replace('updated: 2026-10-15', 'updated: yesterday'))
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]).replace('created: 2026-10-14\n', ''))
    expect(new DatesWritten(['plan.md', 'tasks.md']).check(ctx()).map(g => g.text)).toEqual([
      'plan.md: front matter updated is not a date',
      'tasks.md: front matter created is missing',
    ])
  })

  test('a document that does not exist is no gap of this guard', () => {
    itemAt(t, 'framing')
    rmSync(doc('spec.md'))
    expect(new DatesWritten(['spec.md']).check(ctx())).toEqual([])
  })
})

describe('SlicesImported', () => {
  test('slices in tasks.md that the ledger does not hold are named, with task import as the fix', () => {
    planned(TASKS([{ id: 'T1' }, { id: 'T2' }]))
    expect(new SlicesImported().check(ctx())).toEqual([{ text: 'tasks.md and the ledger differ: T1, T2', fix: 'nook eng task import SHOP-1' }])
  })

  test('a problem of tasks.md is a gap, and the other slice guards then say nothing', () => {
    planned(TASKS([{ id: 'T1', area: '' }]))
    const c = ctx()
    expect(new SlicesImported().check(c).map(g => g.text)).toEqual(['tasks.md: T1: no area'])
    expect([new EveryAcInSlice(), new SliceAreasOfItem(), new NoDependsCycle()].flatMap(g => g.check(c))).toEqual([])
  })

  test('imported slices that equal the file are no gap', () => {
    planned()
    t.eng(LEAD).importTasks('SHOP-1')
    expect(new SlicesImported().check(ctx())).toEqual([])
  })
})

describe('EveryAcInSlice', () => {
  test('a criterion that no slice names is a gap', () => {
    planned(TASKS([{ id: 'T1', acs: '1' }]))
    expect(new EveryAcInSlice().check(ctx())).toEqual([
      { text: 'AC 2 is in no slice: [CHANGE] the error shows a reason', fix: `add 2 to the acs: line of a slice in ${doc('tasks.md')}, then nook eng task import SHOP-1` },
    ])
  })

  test('a slice that names a criterion the spec no longer has is a gap', () => {
    planned(TASKS([{ id: 'T1', acs: '1, 2' }, { id: 'T2', acs: '2, 9' }]))
    expect(new EveryAcInSlice().check(ctx())).toEqual([
      { text: 'T2 names AC 9, but the spec has 2 criteria', fix: `fix the acs: line of T2 in ${doc('tasks.md')}, then nook eng task import SHOP-1` },
    ])
  })
})

describe('the slice guards on an investigation', () => {
  test('an investigation has no slices, so a criterion in no slice and a foreign area are no gap', () => {
    const lead = t.eng(LEAD)
    lead.newItem({ id: 'SHOP-5', title: 'why?', kind: 'investigate', areas: ['bff'] })
    lead.addCriterion('SHOP-5', 'an answer')
    writeDoc(t, 'SHOP-5', 'tasks.md', TASKS([{ id: 'T1', area: 'web', acs: '2', depends: 'T1' }]))
    const c = ctx('SHOP-5')
    expect([new SlicesImported(), new EveryAcInSlice(), new SliceAreasOfItem(), new NoDependsCycle(), new SlicesDone()].flatMap(g => g.check(c))).toEqual([])
  })
})

describe('SliceAreasOfItem', () => {
  test('a slice in an area that the item does not have is a gap', () => {
    planned(TASKS([{ id: 'T1', area: 'web' }]))
    expect(new SliceAreasOfItem().check(ctx()).map(g => g.text)).toEqual(['T1: area web is not an area of SHOP-1 (bff)'])
  })
})

describe('NoDependsCycle', () => {
  test('a cycle in depends is one gap that shows the path', () => {
    planned(TASKS([{ id: 'T1', depends: 'T2' }, { id: 'T2', depends: 'T1' }]))
    expect(new NoDependsCycle().check(ctx())).toEqual([{ text: 'depends has a cycle: T1 → T2 → T1', fix: `break it in ${doc('tasks.md')}, then nook eng task import SHOP-1` }])
  })
})

describe('AutoByOwner', () => {
  test('an item in mode normal is a gap whose fix is an owner command', () => {
    itemAt(t, 'planning')
    expect(new AutoByOwner().check(ctx())).toEqual([
      { text: 'SHOP-1 is not in a yolo run that the owner started (mode normal)', fix: 'owner: /gate mode SHOP-1 yolo, or owner: /gate approve SHOP-1' },
    ])
  })

  test('mode yolo set by the owner is no gap', () => {
    itemAt(t, 'planning')
    t.eng(OWNER).setMode('SHOP-1', 'yolo')
    expect(new AutoByOwner().check(ctx())).toEqual([])
  })
})

describe('FingerprintsUnchanged', () => {
  test('a document that changed after the approve is a gap whose fix is the replan', () => {
    itemAt(t, 'ready')
    writeDoc(t, 'SHOP-1', 'tasks.md', 'changed')
    expect(new FingerprintsUnchanged().check(ctx())).toEqual([{ text: 'tasks.md changed after the approve', fix: 'nook eng item replan SHOP-1' }])
  })

  test('a guard on spec.md alone ignores a change of the plan', () => {
    itemAt(t, 'ready')
    writeDoc(t, 'SHOP-1', 'plan.md', 'changed')
    expect(new FingerprintsUnchanged(['spec.md']).check(ctx())).toEqual([])
  })

  test('a quick item is never held by a fingerprint, even one stored by a later approve', () => {
    const lead = t.eng(LEAD)
    lead.quick('SHOP-30', 'bff')
    lead.stores.approvals.store('SHOP-30', 'spec.md', 'an older hash')
    writeDoc(t, 'SHOP-30', 'spec.md', SPEC())
    expect(new FingerprintsUnchanged().check(ctx('SHOP-30'))).toEqual([])
  })
})

describe('EachArea with BranchNotProtected and AreaFree', () => {
  const areas = new EachArea(new BranchNotProtected(), new AreaFree())

  test('a git area on a protected branch is a gap whose fix is item branch', () => {
    itemAt(t, 'ready')
    expect(areas.check(ctx())).toEqual([{ text: 'area bff is on main, a protected branch', fix: 'nook eng item branch SHOP-1' }])
  })

  test('an area that another item cooks in is a gap', () => {
    itemAt(t, 'cooking')
    itemAt(t, 'ready', 'SHOP-14')
    expect(areas.check(ctx('SHOP-14')).map(g => g.text)).toEqual(['area bff is in use by SHOP-1'])
  })

  test('an area that nook.yml does not have is one gap, and the area guards skip it', () => {
    itemAt(t, 'backlog')
    t.eng(LEAD).ledger.run("UPDATE item SET areas = '[\"ghost\"]' WHERE id = 'SHOP-1'")
    expect(areas.check(ctx())).toEqual([{ text: 'area ghost is not in nook.yml', fix: 'add it with /setup' }])
  })
})

describe('SlicesDone', () => {
  test('no done slice is a gap, and each open slice is one more with the fix of its state', () => {
    itemAt(t, 'cooking', 'SHOP-1', undefined, TASKS([{ id: 'T1' }, { id: 'T2' }]))
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T2')
    lead.moveSlice('fail', 'SHOP-1', 'T2', { reason: 'no' })
    expect(new SlicesDone().check(ctx())).toEqual([
      { text: 'no slice is done', fix: 'nook eng task done SHOP-1 <T> --files <f...>' },
      { text: 'T1 is todo', fix: 'nook eng task done SHOP-1 T1 --files <f...>' },
      { text: 'T2 is failed', fix: 'nook eng task retry SHOP-1 T2, or nook eng task cancel SHOP-1 T2 --reason "<why>"' },
    ])
  })

  test('a waiting slice is fixed by an answer and a resume', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.moveSlice('start', 'SHOP-1', 'T1')
    lead.moveSlice('wait', 'SHOP-1', 'T1', { reason: 'the schema' })
    expect(new SlicesDone().check(ctx())[1]).toEqual({ text: 'T1 is waiting', fix: 'answer what it waits for, then nook eng task resume SHOP-1 T1' })
  })
})

describe('VerifyPassed', () => {
  test('with no passing verify, submit has a gap whose fix is item verify', () => {
    built()
    expect(new VerifyPassed('slices').check(ctx())).toEqual([{ text: 'the checks have not passed since the last move back', fix: 'nook eng item verify SHOP-1' }])
  })

  test('a passing verify clears the gap', () => {
    built()
    t.eng(LEAD).verify('SHOP-1')
    expect(new VerifyPassed('slices').check(ctx())).toEqual([])
  })

  test('the accept guard applies to a quick item only', () => {
    built()
    t.eng(LEAD).quick('SHOP-30', 'web')
    expect(new VerifyPassed('quick').check(ctx())).toEqual([])
    expect(new VerifyPassed('quick').check(ctx('SHOP-30'))).toEqual([{ text: 'the checks have not passed', fix: 'nook eng item verify SHOP-30' }])
  })
})

describe('FindingsFilled and QuestionsAnswered', () => {
  const investigation = () => {
    t.eng(LEAD).newItem({ id: 'SHOP-5', title: 'why?', kind: 'investigate', areas: ['bff'] })
    writeDoc(t, 'SHOP-5', 'spec.md', SPEC({ kind: 'investigate', questions: ['why does it retry?', 'how often?'] }))
  }

  test('an empty findings.md is a gap at submit', () => {
    investigation()
    writeDoc(t, 'SHOP-5', 'findings.md', '# findings\n\n## Q1\n\n<!-- answer -->\n')
    expect(new FindingsFilled().check(ctx('SHOP-5'))).toEqual([
      { text: 'findings.md is not filled', fix: `write ## Q<n> with Answer, Evidence, Open in ${doc('findings.md', 'SHOP-5')}` },
    ])
  })

  test('each question with no answer and evidence is a gap at accept', () => {
    investigation()
    writeDoc(t, 'SHOP-5', 'findings.md', '## Q1\n\n- Answer: a backoff\n- Evidence: job.ts line 12\n')
    expect(new QuestionsAnswered().check(ctx('SHOP-5'))).toEqual([
      { text: 'Q2 has no answer with evidence in findings.md: how often?', fix: `write ## Q2 with Answer and Evidence in ${doc('findings.md', 'SHOP-5')}` },
    ])
  })

  test('the guards of an investigation say nothing for a feature', () => {
    itemAt(t, 'cooking')
    expect([...new FindingsFilled().check(ctx()), ...new QuestionsAnswered().check(ctx())]).toEqual([])
  })
})

describe('CriteriaMarked', () => {
  test('each criterion with no mark is a gap whose fix is ac done', () => {
    itemAt(t, 'cooking')
    expect(new CriteriaMarked().check(ctx())[0]).toEqual({
      text: 'AC 1 is not met: [ADD] the export has the right date',
      fix: 'nook eng item ac done SHOP-1 1 --evidence "<what shows it>" --grade run|sourced|judged|owner',
    })
  })

  test('a spec with more criteria than the ledger is a gap whose fix is the replan', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.markCriterion('SHOP-1', 1, 'the test', 'run')
    lead.markCriterion('SHOP-1', 2, 'the log', 'run')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC({ acs: ['[ADD] the export has the right date', '[CHANGE] the error shows a reason', '[ADD] a third'] }))
    expect(new CriteriaMarked().check(ctx())).toEqual([{ text: 'spec.md has 3 criteria, the ledger has 2', fix: 'nook eng item replan SHOP-1' }])
  })

  test('every criterion marked for the text of the spec is no gap', () => {
    itemAt(t, 'cooking')
    const lead = t.eng(LEAD)
    lead.markCriterion('SHOP-1', 1, 'the test', 'run')
    lead.markCriterion('SHOP-1', 2, 'the log', 'run')
    expect(new CriteriaMarked().check(ctx())).toEqual([])
  })
})

describe('the guard table', () => {
  const names = (move: keyof typeof GUARDS) => GUARDS[move].map(g => g.constructor.name)

  test('proceed runs the owner-yolo guard first, then the guards of approve in their order', () => {
    expect(names('proceed')).toEqual(['AutoByOwner', 'PlanFilled', 'DatesWritten', 'SlicesImported', 'EveryAcInSlice', 'SliceAreasOfItem', 'NoDependsCycle', 'NoOpenBlockingQuestion'])
  })

  test('agree checks the spec, then its dates, then the questions', () => {
    expect(names('agree')).toEqual(['SpecParses', 'DatesWritten', 'NoOpenBlockingQuestion'])
  })

  test('begin compares the fingerprints before it looks at the areas', () => {
    expect(names('begin')).toEqual(['FingerprintsUnchanged', 'EachArea'])
  })

  test('submit and accept compare spec.md first', () => {
    expect(names('submit')).toEqual(['FingerprintsUnchanged', 'FindingsFilled', 'SlicesDone', 'VerifyPassed'])
    expect(names('accept')).toEqual(['FingerprintsUnchanged', 'QuestionsAnswered', 'CriteriaMarked', 'VerifyPassed'])
  })

  test('the moves back, block, unblock, cancel and restore have no guard', () => {
    expect(['start', 'reject', 'replan', 'reframe', 'reopen', 'block', 'unblock', 'cancel', 'restore'].flatMap(m => names(m as keyof typeof GUARDS))).toEqual([])
  })
})
