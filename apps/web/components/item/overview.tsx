import type { EventLine } from '@nook/engineering/read/event-lines.ts'
import type { ItemDocs, ItemView } from '@nook/engineering/read/reader.ts'
import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'
import type { Slice } from '@nook/engineering/stores/slices.ts'
import { duration } from '@nook/engineering/format.ts'
import { PercentRing } from '@nook/ui/components/ring.tsx'
import { SegmentBar } from '@nook/ui/components/segment-bar.tsx'
import { Tally } from '@nook/ui/components/tally.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'

import { Inline } from '@/components/blocks/inline.tsx'
import { Branches } from '@/components/item/branches.tsx'
import { Lanes } from '@/components/item/lanes.tsx'
import { NextStep } from '@/components/item/next-step.tsx'
import { Timeline } from '@/components/item/timeline.tsx'
import { STATE_TONE } from '@/components/tones.ts'
import { parseDoc } from '@/lib/blocks.ts'
import { CRITERION_STATE_TONE, type CriterionState, criterionState, timeInSteps } from '@/lib/progress.ts'

const RECEIPTS = 5
const Muted = ({ children }: { children: string }) => <p className="text-[13px] text-muted-foreground">{children}</p>

const CRITERION_ORDER: CriterionState[] = ['met', 'building', 'blocked', 'waits', 'planned']

function CriteriaTile({ view }: { view: ItemView }) {
  const { criteria, slices, item } = view
  if (!criteria.length) return <Tile title="Criteria"><Muted>No criteria yet. The spec step writes them.</Muted></Tile>
  const states = criteria.map(c => criterionState(c, slices, item.state, item.blocked_from))
  const met = states.filter(s => s === 'met').length
  const rows = CRITERION_ORDER.filter(state => state === 'met' || states.includes(state)).map(state => ({ tone: CRITERION_STATE_TONE[state], label: state, value: states.filter(s => s === state).length }))
  return (
    <Tile title="Criteria">
      <div className="flex items-center gap-4">
        <PercentRing value={(100 * met) / criteria.length} label={`${met}/${criteria.length}`} tone="success" size={76} />
        <div className="min-w-0 flex-1">
          <Tally rows={rows} />
        </div>
      </div>
    </Tile>
  )
}

/** The answers of an investigation, from the question cards of findings.md: answered with an answer and its evidence. */
function AnswersTile({ text }: { text: string | null }) {
  const cards = text ? parseDoc(text).blocks.filter(block => block.kind === 'finding') : []
  if (!cards.length) return <Tile title="Answers"><Muted>No answer yet. The work writes them in findings.md.</Muted></Tile>
  const answered = cards.filter(card => card.kind === 'finding' && card.answered).length
  const rows = [{ tone: 'success', label: 'answered', value: answered }, { tone: 'warning', label: 'open', value: cards.length - answered }]
  return (
    <Tile title="Answers">
      <div className="flex items-center gap-4">
        <PercentRing value={(100 * answered) / cards.length} label={`${answered}/${cards.length}`} tone="success" size={76} />
        <div className="min-w-0 flex-1">
          <Tally rows={rows} />
        </div>
      </div>
    </Tile>
  )
}

const SLICE_TONE: Record<Slice['state'], string> = { todo: 'neutral', running: 'primary', waiting: 'warning', failed: 'danger', done: 'success', cancelled: 'neutral' }
const SLICE_LINE: Partial<Record<Slice['state'], string>> = { running: 'is building', waiting: 'waits', failed: 'failed' }

export function SlicesTile({ slices }: { slices: Slice[] }) {
  const live = slices.filter(s => s.state !== 'cancelled')
  if (!live.length) return <Tile title="Slices"><Muted>No slice yet. The plan step writes them.</Muted></Tile>
  const notes = live.filter(s => SLICE_LINE[s.state])
  return (
    <Tile title="Slices" note={`${live.filter(s => s.state === 'done').length} of ${live.length} done`}>
      <SegmentBar label="Slices by state" parts={live.map(s => ({ key: s.id, tone: SLICE_TONE[s.state], label: s.id }))} />
      {notes.length ? (
        <ul className="grid gap-1 text-[12.5px]">
          {notes.map(s => (
            <li key={s.id} data-tone={SLICE_TONE[s.state]} className="flex items-start gap-2">
              <i className="mt-1.5 size-2 shrink-0 rounded-full bg-tone" aria-hidden="true" />
              <span>{`${s.id} · ${s.title} ${SLICE_LINE[s.state]}${s.reason ? `: ${s.reason}` : ''}`}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Tile>
  )
}

function Mark({ id, tone }: { id: string; tone?: string }) {
  return (
    <span data-tone={tone} className="mt-px shrink-0 rounded-md bg-muted px-1.5 font-mono text-[11px] leading-[18px] text-muted-foreground data-[tone]:bg-tone-subtle data-[tone]:text-tone">
      {id}
    </span>
  )
}

function questionNote(q: Question): { text: string; tone?: string } {
  if (q.status === 'answered') return { text: q.answer ?? 'answered' }
  return q.blocking ? { text: 'Open · blocks the build', tone: 'danger' } : { text: 'Open · blocks nothing' }
}

/** The questions of the lead and its guesses, each with its answer or its state; the owner answers in the inbox. */
function QuestionsTile({ questions, guesses }: { questions: Question[]; guesses: Guess[] }) {
  if (!questions.length && !guesses.length) return <Tile title="Questions and guesses"><Muted>No question and no guess.</Muted></Tile>
  return (
    <Tile title="Questions and guesses">
      <ul className="grid gap-3 text-[13px]">
        {questions.map(q => {
          const note = questionNote(q)
          return (
            <li key={q.id} className="flex items-start gap-2.5">
              <Mark id={q.id} />
              <div className="min-w-0 flex-1">
                <p>{q.text}</p>
                <p data-tone={note.tone} className="text-muted-foreground data-[tone]:text-tone">{note.text}</p>
              </div>
            </li>
          )
        })}
        {guesses.map(g => (
          <li key={g.id} className="flex items-start gap-2.5">
            <Mark id={g.id} tone="warning" />
            <div className="min-w-0 flex-1">
              <p>{g.question}</p>
              <p className="text-muted-foreground">{`Took ${g.took} · ${g.impact} impact · ${g.status}`}</p>
            </div>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

/** The In short of the spec; at the plan step, the In short of the plan, which waits for the approve. */
function InShortTile({ view, docs }: { view: ItemView; docs: ItemDocs }) {
  const planning = view.item.state === 'planning'
  const pick = (name: 'spec' | 'plan') => {
    const text = docs.find(doc => doc.name === name)?.text
    const found = text ? parseDoc(text).blocks.find(block => block.kind === 'callout' && block.tone === 'short') : undefined
    return found?.kind === 'callout' ? found.content : null
  }
  const plan = planning ? pick('plan') : null
  const words = plan ?? pick('spec')
  if (!words) return null
  return (
    <Tile title={plan ? 'The plan in short' : 'In short'}>
      <p className="text-[13.5px] leading-[21px]"><Inline content={words} /></p>
    </Tile>
  )
}

function TimeTile({ view, now }: { view: ItemView; now: Date }) {
  const parts = timeInSteps(view.moves, now)
  if (!parts.length) return null
  const total = parts.reduce((sum, part) => sum + part.ms, 0)
  return (
    <Tile title="Time in each step" note={`${duration(total)} so far`}>
      <SegmentBar label="Time in each step" parts={parts.map(part => ({ key: part.step, tone: STATE_TONE[part.step] ?? 'neutral', size: part.ms }))} />
      <Tally columns={3} rows={parts.map(part => ({ tone: STATE_TONE[part.step] ?? 'neutral', label: part.step, value: duration(part.ms) }))} />
    </Tile>
  )
}

/** The events of the item, newest first: what each agent and the owner did, with its proof. */
export function Receipts({ events, limit }: { events: EventLine[]; limit?: number }) {
  const newest = events.toReversed().slice(0, limit)
  return (
    <Tile title="Receipts" note={events.length}>
      {newest.length ? <Timeline events={newest} /> : <Muted>Nothing happened yet.</Muted>}
    </Tile>
  )
}

/** The first tab of an item: who moves next, the criteria or the answers, the slices, the questions, the time in each step, the lanes, the code and the receipts. */
export function Overview({ view, docs, now }: { view: ItemView; docs: ItemDocs; now: Date }) {
  // an investigation has findings and no criteria; its slices are optional
  const findings = docs.find(doc => doc.name === 'findings')
  return (
    <>
      <NextStep next={view.next} />
      <div className="grid gap-3 md:grid-cols-2">
        {findings ? <AnswersTile text={findings.text} /> : <CriteriaTile view={view} />}
        {findings && !view.slices.length ? null : <SlicesTile slices={view.slices} />}
        <QuestionsTile questions={view.questions} guesses={view.guesses} />
        <InShortTile view={view} docs={docs} />
      </div>
      <TimeTile view={view} now={now} />
      <Lanes slices={view.slices} />
      {view.changes.length ? (
        <Tile title="Branches and checks">
          <Branches changes={view.changes} checks={view.checks} />
        </Tile>
      ) : null}
      <Receipts events={view.events.filter(e => !e.step)} limit={RECEIPTS} />
    </>
  )
}
