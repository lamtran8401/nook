import { describe, expect, test } from 'bun:test'

import type { ItemView } from '@nook/engineering/read/reader.ts'
import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'

import { Branches } from '@/components/item/Branches.tsx'
import { DocTab } from '@/components/item/DocTab.tsx'
import { ItemDialog } from '@/components/item/ItemDialog.tsx'
import { ItemHeader } from '@/components/item/ItemHeader.tsx'
import { ItemPage, tabOf } from '@/components/item/ItemPage.tsx'
import { NeedsYou } from '@/components/item/NeedsYou.tsx'
import { NextStep } from '@/components/item/NextStep.tsx'
import { Owner, ViewerNote } from '@/components/Owner.tsx'
import { SliceBoard } from '@/components/item/SliceBoard.tsx'
import { Stats } from '@/components/item/Stats.tsx'
import { Stepper } from '@/components/item/Stepper.tsx'
import { Timeline } from '@/components/item/Timeline.tsx'
import { html, text } from '@/test/markup.ts'

process.env.TZ = 'UTC'

const question = (id: string, textOf: string, blocking: boolean, fields: Partial<Question> = {}): Question => ({
  id, item: 'SHOP-42', text: textOf, blocking, recommended: null, answer: null, status: 'open', asked_by: 'lead', answered_by: null, asked_at: '2026-10-16T11:12:00Z', answered_at: null, ...fields,
})
const guess = (id: string, status: Guess['status']): Guess => ({
  id, item: 'SHOP-42', question: 'When does a declined charge try again?', took: 'after 1, 5 and 30 minutes', other: 'once after an hour', impact: 'high', slices: ['T9'], status, answer: null, by: 'lead', at: '2026-10-15T10:00:00Z',
})
const slice = (id: string, state: Slice['state'], fields: Partial<Slice> = {}) => ({ item: 'SHOP-42', id, title: `slice ${id}`, area: 'api', depends: [], state, assignee: null, reason: null, ...fields }) as Slice

const view: ItemView = {
  item: { id: 'SHOP-42', title: 'Pay for an order with a saved card', kind: 'feature', size: 'L', mode: 'normal', state: 'cooking', areas: ['api', 'web'] } as ItemView['item'],
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
    { at: '2026-10-15T09:40:00Z', title: 'You approved the plan', text: null, tone: 'primary' },
    { at: '2026-10-15T16:30:00Z', title: 'The lead ran the checks', text: '1/2 checks passed', tone: 'danger' },
    { at: '2026-10-16T11:12:00Z', title: 'The lead asked or answered a question', text: 'Q3', tone: 'neutral' },
  ],
  checks: [
    { id: 1, item: 'SHOP-42', area: 'api', check: 'test', result: 'pass', output: '', at: '2026-10-16T14:55:00Z' },
    { id: 2, item: 'SHOP-42', area: 'api', check: 'lint', result: 'fail', output: '', at: '2026-10-16T14:50:00Z' },
  ],
  changes: [{ area: 'api', branch: 'nook/SHOP-42-pay-with-a-saved-card', files: [{ path: 'src/pay.ts', state: 'new', add: 120, del: 0 }, { path: 'src/cart.ts', state: 'changed', add: 12, del: 4 }] }],
}
const NOW = new Date('2026-10-16T15:10:00Z')
const specOf = (markup: string) => JSON.parse(/data-nook-diagram="([^"]*)"/.exec(markup)![1]!.replaceAll('&quot;', '"').replaceAll('&amp;', '&'))

describe('ItemHeader', () => {
  test('shows the way back to the board, the title, the chips and the key moments', () => {
    const sentBack = { ...view, moves: [...view.moves, { move: 'reject' as const, to: 'cooking' as const, at: '2026-10-16T09:00:00Z' }] }
    const markup = html(<ItemHeader view={sentBack} />)
    expect(text(markup)).toBe('Works SHOP-42 Pay for an order with a saved card cooking feature size L api web normal yolo Started 14 Oct Approved 15 Oct 09:40 Sent back 1×')
    expect(markup).toContain('value="normal" aria-pressed="true"')
    expect(markup).toContain('value="yolo" aria-pressed="false"')
  })
})

describe('NextStep', () => {
  test('a gate of the owner gets its button, such as Approve', () => {
    const markup = html(<NextStep next={{ ...view.next, state: 'planning', owner: true, skill: 'owner: /gate approve SHOP-42' }} />)
    expect(markup).toContain('<input type="hidden" name="kind" value="gate"/><input type="hidden" name="item" value="SHOP-42"/><input type="hidden" name="move" value="approve"/>')
    expect(markup).toContain('<button type="submit" class="bn-btn" data-variant="primary">Approve</button>')
    expect(text(markup)).toBe('Next step YOU Your move: approve The button runs the move with the same guards as /gate approve. Approve')
  })

  test('a blocking question is a move of the owner with no gate: it names the answer to give', () => {
    const next = { ...view.next, owner: true, skill: 'answer Q3: nook eng answer SHOP-42 Q3 "<answer>"', detail: 'Q3 Must a refund go to the same card?' }
    const markup = html(<NextStep next={next} />)
    expect(text(markup)).toBe('Next step YOU Your move: answer Q3 Q3 Must a refund go to the same card? nook eng answer SHOP-42 Q3 "<answer>"')
    expect(markup).toContain('<code class="nk-cmd">nook eng answer SHOP-42 Q3 &quot;&lt;answer&gt;&quot;')
  })

  test('a move of the lead names its command to copy and says that nothing waits, with no move button', () => {
    const markup = html(<NextStep next={view.next} />)
    expect(markup).not.toContain('class="bn-btn"')
    expect(markup).toContain('<span class="nk-turn" data-tone="violet" title="The lead runs /cook SHOP-42">AI</span>')
    expect(text(markup)).toBe('Next step AI The lead runs /cook SHOP-42 Nothing waits for you.')
  })
})

describe('the owner moves on a page', () => {
  const approve = { ...view.next, state: 'planning' as const, owner: true, skill: 'owner: /gate approve SHOP-42' }

  test('a browser with no pair gets each button off, and the form names the command that pairs it', () => {
    const markup = html(<NextStep next={approve} />)
    expect(markup).toContain('title="Pair this browser to run your moves: nook web pair"')
    expect(markup).toContain('<fieldset class="nk-move__controls" disabled="">')
  })

  test('a paired browser gets the buttons on', () => {
    const markup = html(<Owner paired><NextStep next={approve} /></Owner>)
    expect(markup).toContain('<fieldset class="nk-move__controls">')
    expect(markup).not.toContain('title="Pair this browser')
  })

  test('the note of a browser with no pair says how to pair it, and a paired browser gets none', () => {
    expect(text(html(<ViewerNote />))).toBe('View only. To run your moves here, run nook web pair in your terminal and open its link in this browser.')
    expect(html(<Owner paired><ViewerNote /></Owner>)).toBe('')
  })
})

describe('Stepper', () => {
  test('marks the states before the current one as done, each with the time the item came into it', () => {
    const markup = html(<Stepper state="cooking" moves={view.moves} />)
    expect([...markup.matchAll(/data-state="(\w+)"/g)].map(m => m[1])).toEqual(['done', 'done', 'done', 'done', 'current', 'upcoming', 'upcoming'])
    expect(text(markup)).toBe('backlog 14 Oct 09:10 framing 14 Oct 10:00 planning 14 Oct 16:30 ready 15 Oct 09:40 5 cooking 15 Oct 10:05 6 review 7 done')
  })

  test('a blocked item keeps the last state of the flow that it reached as its place', () => {
    const blocked = [...view.moves, { move: 'block' as const, to: 'blocked' as const, at: '2026-10-16T08:00:00Z' }]
    expect([...html(<Stepper state="blocked" moves={blocked} />).matchAll(/data-state="(\w+)"/g)].map(m => m[1])).toEqual(['done', 'done', 'done', 'done', 'current', 'upcoming', 'upcoming'])
  })
})

describe('Stats', () => {
  test('gives the criteria met, the slices done, the time in the state and the times sent back', () => {
    const markup = html(<Stats view={view} now={NOW} />)
    expect(text(markup)).toBe('Criteria met 1 / 2 50% Slices done 1 / 4 25% In cooking 1d 5h Sent back 0 times')
  })
})

describe('NeedsYou', () => {
  test('lists the blocking question first, then the open one, the guess to check and the gate, then the full lists', () => {
    expect(text(html(<NeedsYou view={view} />))).toBe(
      'Questions 2 open ? Q3: Must a refund go to the same card? Blocking · asked 16 Oct 11:12 Answer ' +
        '? Q4: Must the list show the expiry date? Open · blocks nothing · asked 16 Oct 11:12 Answer ' +
        'Guesses to check 1 ! G5 · high: When does a declined charge try again? Took: after 1, 5 and 30 minutes. The other way: once after an hour. Shapes T9. Accept Flip ' +
        'Gate → No gate waits for you Next: the lead runs /cook SHOP-42. ' +
        'All questions · 3 Q1 Which currency? the shop currency answered Q3 Must a refund go to the same card? asked 16 Oct blocking Q4 Must the list show the expiry date? asked 16 Oct open ' +
        'All guesses · 2 G2 When does a declined charge try again? after 1, 5 and 30 minutes high accepted G5 When does a declined charge try again? after 1, 5 and 30 minutes high open',
    )
  })

  test('gives each open question its answer box and each guess to check its Accept and Flip, as owner moves', () => {
    const markup = html(<NeedsYou view={view} />)
    expect(markup).toContain('<input type="hidden" name="kind" value="answer"/><input type="hidden" name="item" value="SHOP-42"/><input type="hidden" name="question" value="Q3"/>')
    expect(markup).toContain('<input class="bn-input" placeholder="Your answer" aria-label="Answer to Q3" required="" name="answer"/>')
    expect(markup).toContain('<button type="submit" value="flip" class="bn-btn" data-size="sm" data-variant="ghost" name="decision">Flip</button>')
  })

  test('names the gate of the owner when one waits', () => {
    const planning = { ...view, needs: { questions: [], guesses: [] }, next: { ...view.next, owner: true, skill: 'owner: /gate approve SHOP-42' } }
    expect(text(html(<NeedsYou view={planning} />))).toContain('Gate → Your approve waits Use the button of the next step, or type /gate approve SHOP-42 in the agent session.')
  })
})

describe('SliceBoard', () => {
  test('draws a Bench board by state: a waiting or failed slice says why, a slice to do names what it waits for', () => {
    expect(specOf(html(<SliceBoard slices={view.slices} />))).toEqual({
      type: 'board', colWidth: 260,
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
    expect(text(html(<DocTab id="SHOP-42" name="walkthrough" text={null} areas={[]} criteria={[]} />))).toBe(
      'The walkthrough is not written yet The walkthrough comes after the build. When the item reaches review, type /view SHOP-42 in the agent session.',
    )
  })

  test('renders the document with its path, its dates, its title and its blocks', () => {
    const markup = html(<DocTab id="SHOP-42" name="plan" text={'---\ncreated: 2026-10-14\n---\n# The plan\n\nOne paragraph.\n'} areas={[]} criteria={[]} />)
    expect(text(markup)).toBe('works/SHOP-42/plan.md · created 2026-10-14 The plan One paragraph.')
  })
})

describe('ItemPage', () => {
  const docs = { spec: '# Spec\n\nThe spec.\n', plan: null, tasks: null, walkthrough: null }

  test('marks the open tab, and gives each tab its own address', () => {
    const markup = html(<ItemPage view={view} docs={docs} tab="spec" now={NOW} />)
    expect([...markup.matchAll(/<a class="bn-tabs__tab" role="tab" aria-selected="(\w+)" href="([^"]+)"/g)].map(m => `${m[2]} ${m[1]}`)).toEqual([
      '/works/SHOP-42 false', '/works/SHOP-42?tab=spec true', '/works/SHOP-42?tab=plan false', '/works/SHOP-42?tab=tasks false', '/works/SHOP-42?tab=walkthrough false',
    ])
    expect(text(markup)).toEndWith('works/SHOP-42/spec.md Spec The spec.')
  })

  test('takes an unknown tab as the Overview', () => {
    expect([tabOf('plan'), tabOf('secrets'), tabOf(undefined)]).toEqual(['plan', 'overview', 'overview'])
  })
})

describe('ItemDialog', () => {
  test('shows the head, the criteria, the slices and the last events, newest first, with the link to the full page', () => {
    const markup = html(<ItemDialog view={view} />)
    expect(markup).toContain('<a class="bn-btn" data-variant="primary" href="/works/SHOP-42" target="_blank" rel="noopener">Open in new tab</a>')
    expect(text(markup)).toBe(
      'SHOP-42 Pay for an order with a saved card cooking feature size L api web ' +
        'Criteria AC1 A saved card pays in one click. api test passes met AC2 A decline shows the reason. open ' +
        'Slices T1 slice T1 done T7 slice T7 waits for Q3 waiting T9 slice T9 the clock fake skips the 5 min try failed T10 slice T10 todo ' +
        'Last events 16 Oct 11:12 The lead asked or answered a question · Q3 15 Oct 16:30 The lead ran the checks · 1/2 checks passed 15 Oct 09:40 You approved the plan ' +
        'Open in new tab',
    )
  })
})
