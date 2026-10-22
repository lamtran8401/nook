import { describe, expect, test } from 'bun:test'

import type { ItemView } from '@nook/engineering/read/reader.ts'
import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'
import { SidePanel } from '@nook/ui/components/side-panel.tsx'

import { Activity } from '@/components/item/activity.tsx'
import { Branches } from '@/components/item/branches.tsx'
import { DocTab } from '@/components/item/doc-tab.tsx'
import { GateBar } from '@/components/item/gate-bar.tsx'
import { ItemAside } from '@/components/item/item-aside.tsx'
import { ItemHead } from '@/components/item/item-head.tsx'
import { ItemPage, tabOf } from '@/components/item/item-page.tsx'
import { ItemPanel } from '@/components/item/item-panel.tsx'
import { lanesSpec } from '@/components/item/lanes.tsx'
import { Overview } from '@/components/item/overview.tsx'
import { NextStep } from '@/components/item/next-step.tsx'
import { Owner, ViewerNote } from '@/components/owner.tsx'
import { SliceBoard } from '@/components/item/slice-board.tsx'
import { Timeline } from '@/components/item/timeline.tsx'
import { html, text } from '@/test/markup.ts'

process.env.TZ = 'UTC'

const question = (id: string, textOf: string, blocking: boolean, fields: Partial<Question> = {}): Question => ({
  id, item: 'SHOP-42', text: textOf, blocking, recommended: null, answer: null, status: 'open', asked_by: 'lead', answered_by: null, asked_at: '2026-10-16T11:12:00Z', answered_at: null, ...fields,
})
const guess = (id: string, status: Guess['status']): Guess => ({
  id, item: 'SHOP-42', question: 'When does a declined charge try again?', took: 'after 1, 5 and 30 minutes', other: 'once after an hour', impact: 'high', slices: ['T9'], status, answer: null, by: 'lead', at: '2026-10-15T10:00:00Z',
})
const slice = (id: string, state: Slice['state'], fields: Partial<Slice> = {}) => ({ item: 'SHOP-42', id, title: `slice ${id}`, area: 'api', depends: [], acs: [], state, assignee: null, reason: null, ...fields }) as Slice

const view: ItemView = {
  item: { id: 'SHOP-42', title: 'Pay for an order with a saved card', kind: 'feature', size: 'L', points: 8, mode: 'normal', state: 'cooking', areas: ['api', 'web'] } as ItemView['item'],
  next: { id: 'SHOP-42', state: 'cooking', skill: '/cook SHOP-42', owner: false, gaps: [], detail: '' },
  moves: [
    { move: 'new', to: 'backlog', at: '2026-10-14T09:10:00Z' },
    { move: 'start', to: 'framing', at: '2026-10-14T10:00:00Z' },
    { move: 'agree', to: 'planning', at: '2026-10-14T16:30:00Z' },
    { move: 'approve', to: 'ready', at: '2026-10-15T09:40:00Z' },
    { move: 'begin', to: 'cooking', at: '2026-10-15T10:05:00Z' },
  ],
  needs: { questions: [question('Q3', 'Must a refund go to the same card?', true), question('Q4', 'Must the list show the expiry date?', false)], guesses: [guess('G5', 'open')] },
  criteria: [
    { item: 'SHOP-42', n: 1, text: 'A saved card pays in one click.', done: true, evidence: 'api test passes', grade: 'run', by: 'verifier', at: 'now' },
    { item: 'SHOP-42', n: 2, text: 'A decline shows the reason.', done: false, evidence: null, grade: null, by: null, at: null },
  ],
  slices: [slice('T1', 'done', { assignee: 'api-builder' }), slice('T7', 'waiting', { reason: 'waits for Q3' }), slice('T9', 'failed', { area: 'worker', reason: 'the clock fake skips the 5 min try' }), slice('T10', 'todo', { depends: ['T9'] })],
  questions: [question('Q1', 'Which currency?', false, { status: 'answered', answer: 'the shop currency' }), question('Q3', 'Must a refund go to the same card?', true), question('Q4', 'Must the list show the expiry date?', false)],
  guesses: [guess('G2', 'accepted'), guess('G5', 'open')],
  events: [
    { at: '2026-10-15T09:40:00Z', title: 'You approved the plan', text: null, tone: 'primary', step: true },
    { at: '2026-10-15T16:30:00Z', title: 'The lead ran the checks', text: '1/2 checks passed', tone: 'danger', step: false },
    { at: '2026-10-16T11:12:00Z', title: 'The lead asked or answered a question', text: 'Q3', tone: 'neutral', step: false },
  ],
  checks: [
    { id: 1, item: 'SHOP-42', area: 'api', check: 'test', result: 'pass', output: '', at: '2026-10-16T14:55:00Z' },
    { id: 2, item: 'SHOP-42', area: 'api', check: 'lint', result: 'fail', output: '', at: '2026-10-16T14:50:00Z' },
  ],
  changes: [{ area: 'api', branch: 'nook/SHOP-42-pay-with-a-saved-card', files: [{ path: 'src/pay.ts', state: 'new', add: 120, del: 0 }, { path: 'src/cart.ts', state: 'changed', add: 12, del: 4 }] }],
}
const NOW = new Date('2026-10-16T15:10:00Z')
const specOf = (markup: string) => JSON.parse(/data-diagram="([^"]*)"/.exec(markup)![1]!.replaceAll('&quot;', '"').replaceAll('&amp;', '&'))

describe('ItemHead', () => {
  test('shows the id, the step, the kind, the points and the mode, the title, the command of the lead and the steps', () => {
    const markup = html(<ItemHead view={view} />)
    expect(text(markup)).toBe('SHOP-42 · cooking · feature 8 pt normal Pay for an order with a saved card /cook SHOP-42 backlog framing planning ready cooking review done')
    expect(/<li aria-current="step"[^>]*>[\s\S]*?<\/li>/.exec(markup)![0]).toContain('cooking')
  })

  test('a blocked item keeps its place at the last step of the flow that it reached', () => {
    const blocked = { ...view, item: { ...view.item, state: 'blocked' as const }, moves: [...view.moves, { move: 'block' as const, to: 'blocked' as const, at: '2026-10-16T08:00:00Z' }] }
    expect(/<li aria-current="step"[^>]*>[\s\S]*?<\/li>/.exec(html(<ItemHead view={blocked} />))![0]).toContain('cooking')
  })
})

describe('ItemAside', () => {
  const docs = [{ name: 'spec' as const, text: '# Spec' }, { name: 'plan' as const, text: null }]

  test('gives the details of the item: step, kind, size, points, mode, areas, branch, time in the step and creation day', () => {
    const markup = html(<ItemAside view={view} docs={docs} tab="overview" now={NOW} base="/personal" />)
    expect(text(markup)).toStartWith('Details Step cooking Kind feature Size L Points 8 pt Mode normal yolo Areas api web Branch nook/SHOP-42-pay-with-a-saved-card In this step 1 d 5 h Created 14 Oct')
    const mode = (value: string) => new RegExp(`<button[^>]*value="${value}"[^>]*>`).exec(markup)![0]
    expect(mode('normal')).toContain('data-state="on"')
    expect(mode('yolo')).toContain('type="submit"')
  })

  test('links each document of the item, and says which one is not written yet', () => {
    const markup = html(<ItemAside view={view} docs={docs} tab="spec" now={NOW} base="/personal" />)
    expect(text(markup)).toEndWith('Documents spec.md why, what changes, the criteria plan.md not written yet')
    expect(markup).toContain('<a href="/personal/works/SHOP-42?tab=spec" aria-current="page"')
  })
})

describe('NextStep', () => {
  test('a gate of the owner says its move, and leaves the button to the gate bar', () => {
    const markup = html(<NextStep next={{ ...view.next, state: 'planning', owner: true, skill: 'owner: /gate approve SHOP-42' }} />)
    expect(markup).not.toContain('data-slot="button"')
    expect(text(markup)).toBe('YOU Next · You Approve the plan, and the build can start.')
  })

  test('a blocking question is a move of the owner with no gate: it names the answer to give', () => {
    const next = { ...view.next, owner: true, skill: 'answer Q3: nook eng answer SHOP-42 Q3 "<answer>"', detail: 'Q3 Must a refund go to the same card?' }
    const markup = html(<NextStep next={next} />)
    expect(text(markup)).toBe('YOU Next · You Answer Q3: Must a refund go to the same card? nook eng answer SHOP-42 Q3 "<answer>"')
    expect(markup).toMatch(/<code data-slot="copy-command"[^>]*>nook eng answer SHOP-42 Q3 &quot;&lt;answer&gt;&quot;/)
  })

  test('a move of the lead names its command to copy and says that nothing waits, with no move button', () => {
    const markup = html(<NextStep next={view.next} />)
    expect(markup).not.toContain('data-slot="button"')
    expect(text(markup)).toBe('AI Next · The lead The lead runs /cook SHOP-42. Nothing waits for you. /cook SHOP-42')
  })
})

describe('the owner moves on a page', () => {
  const approve = { ...view.next, state: 'planning' as const, owner: true, skill: 'owner: /gate approve SHOP-42' }

  test('a browser with no pair gets each button off, and the form names the command that pairs it', () => {
    const markup = html(<GateBar next={approve} />)
    expect(markup).toContain('title="Pair this browser to run your moves: nook web pair"')
    expect(/<fieldset[^>]*>/.exec(markup)![0]).toContain('disabled=""')
  })

  test('a paired browser gets the buttons on', () => {
    const markup = html(<Owner paired><GateBar next={approve} /></Owner>)
    expect(/<fieldset[^>]*>/.exec(markup)![0]).not.toContain(' disabled=""')
    expect(markup).not.toContain('title="Pair this browser')
  })

  test('the note of a browser with no pair says how to pair it, and a paired browser gets none', () => {
    expect(text(html(<ViewerNote />))).toBe('View only. To run your moves here, run nook web pair in your terminal and open its link in this browser.')
    expect(html(<Owner paired><ViewerNote /></Owner>)).toBe('')
  })
})

describe('SliceBoard', () => {
  test('draws a Bench board by state: a waiting or failed slice says why, a slice to do names what it waits for', () => {
    expect(specOf(html(<SliceBoard slices={view.slices} />))).toEqual({
      type: 'board', colWidth: 260, colHeight: 0,
      columns: [
        { title: 'To do', tone: 'neutral', cards: [
          { id: 'T7', title: 'slice T7', areas: [{ name: 'api' }], flag: 'wait', foot: [{ icon: 'clock', text: 'waits for Q3', kind: 'wait' }] },
          { id: 'T10', title: 'slice T10', areas: [{ name: 'api' }], foot: [{ icon: 'link', text: 'after T9' }] },
        ] },
        { title: 'Building', tone: 'primary', cards: [{ id: 'T9', title: 'slice T9', areas: [{ name: 'worker' }], flag: 'fail', foot: [{ icon: 'alert', text: 'the clock fake skips the 5 min try', kind: 'fail' }] }] },
        { title: 'Done', tone: 'success', cards: [{ id: 'T1', title: 'slice T1', areas: [{ name: 'api' }], note: 'api-builder', noteIcon: 'user' }] },
      ],
    })
  })
})

describe('Overview', () => {
  const tiles = (markup: string) => [...markup.matchAll(/<section data-slot="tile"[\s\S]*?<\/section>/g)].map(m => text(m[0]))
  const tile = (markup: string, title: string) => tiles(markup).find(words => words.startsWith(title))!
  const built = { ...view, slices: [slice('T1', 'done', { acs: [1] }), slice('T7', 'waiting', { acs: [2], reason: 'waits for Q3' }), slice('T9', 'failed', { reason: 'the clock fake skips the 5 min try' }), slice('T10', 'todo')] }
  const spec = { name: 'spec' as const, text: '> In short: a shopper pays with a saved card.\n' }
  const plan = { name: 'plan' as const, text: '> In short: the api keeps a token.\n' }

  test('the criteria count by state: met by evidence, blocked by a slice that waits', () => {
    expect(tile(html(<Overview view={built} docs={[]} now={NOW} />), 'Criteria')).toBe('Criteria 1/2 met 1 blocked 1')
  })

  test('before the build, each open criterion is planned', () => {
    const planning = { ...built, item: { ...built.item, state: 'planning' as const } }
    expect(tile(html(<Overview view={planning} docs={[]} now={NOW} />), 'Criteria')).toBe('Criteria 1/2 met 1 planned 1')
  })

  test('the slices give a bar by state and a line for each slice that builds, waits or failed', () => {
    expect(tile(html(<Overview view={built} docs={[]} now={NOW} />), 'Slices')).toBe('Slices 1 of 4 done T1 T7 T9 T10 T7 · slice T7 waits: waits for Q3 T9 · slice T9 failed: the clock fake skips the 5 min try')
  })

  test('lists each question with its answer or its state, and each guess with what it took, its impact and its state', () => {
    const markup = html(<Overview view={view} docs={[]} now={NOW} />)
    expect(tile(markup, 'Questions and guesses')).toBe(
      'Questions and guesses Q1 Which currency? the shop currency Q3 Must a refund go to the same card? Open · blocks the build Q4 Must the list show the expiry date? Open · blocks nothing ' +
        'G2 When does a declined charge try again? Took after 1, 5 and 30 minutes · high impact · accepted G5 When does a declined charge try again? Took after 1, 5 and 30 minutes · high impact · open',
    )
    expect(markup).not.toContain('aria-label="Answer to Q3"')
  })

  test('gives the In short of the spec, and at the plan step the In short of the plan', () => {
    expect(tile(html(<Overview view={view} docs={[spec, plan]} now={NOW} />), 'In short')).toBe('In short A shopper pays with a saved card.')
    const planning = { ...view, item: { ...view.item, state: 'planning' as const } }
    expect(tile(html(<Overview view={planning} docs={[spec, plan]} now={NOW} />), 'The plan in short')).toBe('The plan in short The api keeps a token.')
  })

  test('gives the time in each step, the step it is in counted up to now', () => {
    expect(tile(html(<Overview view={view} docs={[]} now={NOW} />), 'Time in each step')).toBe('Time in each step 2 d 6 h so far backlog 50 min framing 6 h 30 min planning 17 h 10 min ready 25 min cooking 1 d 5 h')
  })

  test('the receipts are the records of the item, newest first, with no step of the flow', () => {
    const markup = html(<Overview view={view} docs={[]} now={NOW} />)
    expect(tile(markup, 'Receipts')).toBe('Receipts 2')
    expect(specOf(markup.slice(markup.indexOf('Receipts'))).items.map((item: { title?: string }) => item.title).filter(Boolean)).toEqual(['The lead asked or answered a question', 'The lead ran the checks'])
  })
})

describe('Activity', () => {
  test('gives the steps of the flow in order, then the receipts', () => {
    const markup = html(<Activity events={view.events} />)
    const [steps, receipts] = [...markup.matchAll(/data-diagram="([^"]*)"/g)].map(m => JSON.parse(m[1]!.replaceAll('&quot;', '"').replaceAll('&amp;', '&')).items.map((item: { title?: string }) => item.title).filter(Boolean))
    expect(steps).toEqual(['You approved the plan'])
    expect(receipts).toEqual(['The lead asked or answered a question', 'The lead ran the checks'])
  })
})

describe('Branches', () => {
  test('gives the branch of each area with its files, its lines and its last checks', () => {
    expect(text(html(<Branches changes={view.changes} checks={view.checks} />))).toBe('api nook/SHOP-42-pay-with-a-saved-card 2 files +132 −4 1 failing 1 pass 14:55')
  })

  test('says so when no area has a branch yet', () => {
    expect(text(html(<Branches changes={[]} checks={[]} />))).toBe('No branch yet The build makes one for each area.')
  })
})

describe('Timeline', () => {
  test('draws each event in order under a heading for its day', () => {
    expect(specOf(html(<Timeline events={view.events} />))).toEqual({
      type: 'timeline',
      items: [
        { day: 'Thursday 15 Oct' },
        { time: '09:40', icon: 'play', tone: 'primary', title: 'You approved the plan' },
        { time: '16:30', icon: 'alert', tone: 'danger', title: 'The lead ran the checks', text: '1/2 checks passed' },
        { day: 'Friday 16 Oct' },
        { time: '11:12', icon: 'clock', tone: 'neutral', title: 'The lead asked or answered a question', text: 'Q3' },
      ],
    })
  })
})

describe('DocTab', () => {
  test('a walkthrough not written yet says to type /view in the agent session', () => {
    expect(text(html(<DocTab item={view.item} name="walkthrough" text={null} criteria={[]} />))).toBe(
      'The walkthrough is not written yet The walkthrough comes after the build. When the item reaches review, type /view SHOP-42 in the agent session.',
    )
  })

  test('renders the document on its card with its path, its dates and its blocks, and leaves out its title', () => {
    const markup = html(<DocTab item={view.item} name="plan" text={'---\ncreated: 2026-10-14\n---\n# The plan\n\nOne paragraph.\n'} criteria={[]} />)
    expect(text(markup)).toBe('works/SHOP-42/plan.md created 2026-10-14 One paragraph.')
  })
})

describe('DocTab of each kind', () => {
  test('a root cause leads with its type and what the type means', () => {
    const markup = html(<DocTab item={view.item} name="root-cause" text={'---\ntype: missing test\n---\n# SHOP-42: the root cause\n\nNo test opened an empty desk.\n'} criteria={[]} />)
    expect(text(markup)).toBe('works/SHOP-42/root-cause.md missing test The earliest point where the bug was made. Retro counts each type across the desk. No test opened an empty desk.')
  })

  test('a root cause with no type yet says to write one', () => {
    expect(text(html(<DocTab item={view.item} name="root-cause" text={'---\ntype: \n---\n'} criteria={[]} />))).toContain('No type yet Write the type in the front matter of root-cause.md before the submit.')
  })

  test('the tasks show the slices by state and the lanes before the words of tasks.md', () => {
    const markup = html(<DocTab item={view.item} name="tasks" text={'## T1: Add the table\n\n- area: api\n'} criteria={[]} slices={view.slices} />)
    const order = ['Slices<span', 'Slices by state', 'Lanes<span', 'Add the table'].map(words => markup.indexOf(words))
    expect(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1]!))).toBe(true)
  })
})

describe('ItemPage', () => {
  const docs = [{ name: 'spec' as const, text: '# Spec\n\nThe spec.\n' }, { name: 'plan' as const, text: null }, { name: 'tasks' as const, text: null }, { name: 'walkthrough' as const, text: null }]
  const tabsIn = (markup: string) => [.../<nav aria-label="Item"[\s\S]*?<\/nav>/.exec(markup)![0].matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map(m => m[1])

  test('marks the open tab, and gives each tab its own address', () => {
    const markup = html(<ItemPage view={view} docs={docs} tab="spec" now={NOW} base="/personal" />)
    const nav = /<nav aria-label="Item"[\s\S]*?<\/nav>/.exec(markup)![0]
    expect([...nav.matchAll(/<a [^>]*href="([^"]*)"[^>]*>/g)].map(m => `${m[1]} ${m[0].includes('aria-current="page"')}`)).toEqual([
      '/personal/works/SHOP-42 false', '/personal/works/SHOP-42?tab=spec true', '/personal/works/SHOP-42?tab=plan false', '/personal/works/SHOP-42?tab=tasks false', '/personal/works/SHOP-42?tab=walkthrough false', '/personal/works/SHOP-42?tab=activity false',
    ])
    expect(text(markup)).toContain('works/SHOP-42/spec.md The spec.')
  })

  test('a fix has the tab of its root cause after the spec', () => {
    const fix = [{ name: 'spec' as const, text: null }, { name: 'root-cause' as const, text: null }, { name: 'plan' as const, text: null }, { name: 'tasks' as const, text: null }, { name: 'walkthrough' as const, text: null }]
    expect(tabsIn(html(<ItemPage view={view} docs={fix} tab="overview" now={NOW} base="/personal" />))).toEqual(['overview', 'spec', 'root cause', 'plan', 'tasks', 'walkthrough', 'activity'])
  })

  test('an investigation has the tabs of its findings and no tasks', () => {
    const investigate = [{ name: 'spec' as const, text: null }, { name: 'plan' as const, text: null }, { name: 'findings' as const, text: null }]
    expect(tabsIn(html(<ItemPage view={view} docs={investigate} tab="overview" now={NOW} base="/personal" />))).toEqual(['overview', 'spec', 'plan', 'findings', 'activity'])
  })

  test('takes a tab that the kind does not have as the overview', () => {
    expect([tabOf('plan', docs), tabOf('findings', docs), tabOf('activity', docs), tabOf(undefined, docs)]).toEqual(['plan', 'overview', 'activity', 'overview'])
  })
})

describe('GateBar', () => {
  test('at the plan step gives Approve, and says that a change of the plan goes to the lead', () => {
    const markup = html(<GateBar next={{ ...view.next, state: 'planning', owner: true, skill: 'owner: /gate approve SHOP-42' }} />)
    expect(text(markup)).toBe('To change the plan, tell the lead in the agent session. Approve')
    expect(markup).toContain('<input type="hidden" name="kind" value="gate"/><input type="hidden" name="item" value="SHOP-42"/><input type="hidden" name="move" value="approve"/>')
  })

  test('at review gives a reason to send it back, Send back and Accept, each its own move', () => {
    const markup = html(<GateBar next={{ ...view.next, state: 'review', owner: true, skill: 'owner: /gate accept SHOP-42' }} />)
    expect(text(markup)).toBe('Send back Accept')
    expect(markup).toContain('<input type="hidden" name="kind" value="back"/><input type="hidden" name="item" value="SHOP-42"/>')
    expect(/<input[^>]*aria-label="Reason to send it back"[^>]*>/.exec(markup)![0]).toContain('required=""')
    expect(markup).toContain('<input type="hidden" name="move" value="accept"/>')
  })

  test('shows nothing when no gate waits for the owner', () => {
    expect(html(<GateBar next={view.next} />)).toBe('')
  })
})

describe('ItemPanel', () => {
  test('heads the drawer with the facts, the link to the full page, the title and the steps, then the overview', () => {
    const markup = html(<SidePanel><ItemPanel view={view} docs={[]} now={NOW} base="/personal" /></SidePanel>)
    expect(markup).toContain('<a href="/personal/works/SHOP-42" data-slot="button"')
    expect(text(markup)).toStartWith('SHOP-42 · cooking · feature 8 pt normal Open page Pay for an order with a saved card backlog framing planning ready cooking review done AI Next · The lead')
  })

  test('holds the moves of the owner at its foot when a gate waits', () => {
    const review = { ...view, next: { ...view.next, state: 'review' as const, owner: true, skill: 'owner: /gate accept SHOP-42' } }
    expect(html(<SidePanel><ItemPanel view={review} docs={[]} now={NOW} base="/personal" /></SidePanel>)).toContain('data-slot="side-panel-footer"')
    expect(html(<SidePanel><ItemPanel view={view} docs={[]} now={NOW} base="/personal" /></SidePanel>)).not.toContain('data-slot="side-panel-footer"')
  })
})
describe('the lanes of the slices', () => {
  test('give one lane for each area, a node for each slice with its state in its kicker on a node of its tone, and an edge for each slice it waits for', () => {
    expect(lanesSpec([slice('T1', 'done'), slice('T2', 'running', { area: 'web', depends: ['T1'] }), slice('T3', 'todo', { depends: ['T1', 'T2'] }), slice('T4', 'cancelled')])).toEqual({
      type: 'graph',
      nodes: [
        { id: 'T1', kicker: 'T1 · DONE', title: 'slice T1', tone: 'success', fill: 'soft' },
        { id: 'T2', kicker: 'T2 · RUNNING', title: 'slice T2', tone: 'primary', fill: 'soft', hl: true },
        { id: 'T3', kicker: 'T3', title: 'slice T3' },
      ],
      edges: [{ from: 'T1', to: 'T2' }, { from: 'T1', to: 'T3' }, { from: 'T2', to: 'T3' }],
      groups: [{ label: 'api', nodes: ['T1', 'T3'] }, { label: 'web', nodes: ['T2'] }],
    })
  })

  test('are none for an item with no slice yet', () => {
    expect(lanesSpec([slice('T1', 'cancelled')])).toBeNull()
  })

  test('show above the slices of the Tasks tab', () => {
    const markup = html(<ItemPage view={view} docs={[{ name: 'tasks', text: '# Slices\n\n## T1: Add the table\n\n- area: api\n' }]} tab="tasks" now={NOW} base="/personal" />)
    expect(markup.indexOf('Lanes<span')).toBeLessThan(markup.indexOf('Add the table'))
    expect(markup).toContain('&quot;type&quot;:&quot;graph&quot;')
  })
})
