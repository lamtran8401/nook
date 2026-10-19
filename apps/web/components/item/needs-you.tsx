import type { ItemView } from '@nook/engineering/read/reader.ts'
import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'
import { ActionList, ActionRow, ListHeading } from '@nook/ui/components/action-list.tsx'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Button } from '@nook/ui/components/button.tsx'
import { Card } from '@nook/ui/components/card.tsx'
import { Disclosure } from '@nook/ui/components/disclosure.tsx'
import { Input } from '@nook/ui/components/input.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'

import { Move } from '@/components/item/move.tsx'
import { clock, day } from '@/lib/time.ts'

const GUESS_TONE: Record<Guess['status'], string> = { open: 'warning', accepted: 'success', flipped: 'primary' }

/** The answer of the owner to an open question, typed on the page. */
function AnswerForm({ item, question }: { item: string; question: Question }) {
  return (
    <div className="mt-2.5 flex">
      <Move fields={{ kind: 'answer', item, question: question.id }} className="flex w-full" grow>
        <Input name="answer" className="h-9 flex-1" placeholder={question.recommended ? `Recommended: ${question.recommended}` : 'Your answer'} aria-label={`Answer to ${question.id}`} required />
        <Button type="submit" size="sm" variant="outline">Answer</Button>
      </Move>
    </div>
  )
}

/** Keep the guess, or flip it: the slices that it shaped go back to todo. */
function GuessMoves({ item, guess }: { item: string; guess: Guess }) {
  return (
    <Move fields={{ kind: 'guess', item, guess: guess.id }}>
      <Button type="submit" name="decision" value="accept" size="sm" variant="outline">Accept</Button>
      <Button type="submit" name="decision" value="flip" size="sm" variant="ghost">Flip</Button>
    </Move>
  )
}

const questionNote = (q: Question) => `${q.blocking ? 'Blocking' : 'Open · blocks nothing'} · asked ${day(q.asked_at)} ${clock(q.asked_at)}${q.recommended ? ` · recommended: ${q.recommended}` : ''}`
const guessNote = (g: Guess) => `Took: ${g.took}. The other way: ${g.other}.${g.slices.length ? ` Shapes ${g.slices.join(', ')}.` : ''}`

const questionState = (q: Question) => (q.status === 'answered' ? { tone: 'success', text: 'answered' } : q.blocking ? { tone: 'danger', text: 'blocking' } : { tone: 'warning', text: 'open' })

function AllQuestions({ questions }: { questions: Question[] }) {
  return (
    <Disclosure summary={`All questions · ${questions.length}`}>
      <RecordList
        rows={questions.map(q => {
          const state = questionState(q)
          return { id: q.id, main: q.text, sub: q.answer ?? `asked ${day(q.asked_at)}`, end: <Badge tone={state.tone}>{state.text}</Badge> }
        })}
      />
    </Disclosure>
  )
}

function AllGuesses({ guesses }: { guesses: Guess[] }) {
  return (
    <Disclosure summary={`All guesses · ${guesses.length}`}>
      <RecordList
        rows={guesses.map(g => ({
          id: g.id,
          main: g.question,
          sub: g.answer ?? g.took,
          end: (
            <span className="flex gap-1">
              <Badge variant="outline">{g.impact}</Badge>
              <Badge tone={GUESS_TONE[g.status]}>{g.status}</Badge>
            </span>
          ),
        }))}
      />
    </Disclosure>
  )
}

/** What waits for the owner first: each open question, the blocking ones on top, each guess to check, and the gate. */
export function NeedsYou({ view }: { view: ItemView }) {
  const { questions, guesses } = view.needs
  const gate = view.next.owner && view.next.skill.startsWith('owner: /gate ') ? view.next.skill.slice('owner: /gate '.length) : null
  return (
    <Card className="gap-1 px-5 pt-2.5 pb-4">
      <ListHeading>Questions <Badge variant="outline">{questions.length} open</Badge></ListHeading>
      <ActionList>
        {questions.length ? (
          questions.map(q => (
            <ActionRow key={q.id} tone={q.blocking ? 'danger' : 'warning'} icon="?" title={`${q.id}: ${q.text}`} note={questionNote(q)}>
              <AnswerForm item={view.item.id} question={q} />
            </ActionRow>
          ))
        ) : (
          <ActionRow tone="neutral" icon="✓" title="No open question" note="The lead asks with nook eng ask; a blocking one stops its slices." />
        )}
      </ActionList>
      <ListHeading>Guesses to check <Badge variant="outline">{guesses.length}</Badge></ListHeading>
      <ActionList>
        {guesses.length ? (
          guesses.map(g => <ActionRow key={g.id} tone="warning" icon="!" title={`${g.id} · ${g.impact}: ${g.question}`} note={guessNote(g)} act={<GuessMoves item={view.item.id} guess={g} />} />)
        ) : (
          <ActionRow tone="neutral" icon="✓" title="No guess to check" note="Each guess of the lead is accepted or flipped." />
        )}
      </ActionList>
      <ListHeading>Gate</ListHeading>
      <ActionList>
        {gate ? (
          <ActionRow tone="primary" icon="→" title={`Your ${gate.split(' ')[0]} waits`} note={`Use the button of the next step, or type /gate ${gate} in the agent session.`} />
        ) : (
          <ActionRow tone="neutral" icon="→" title="No gate waits for you" note={view.next.owner ? 'First answer the blocking question above.' : `Next: the lead runs ${view.next.skill}.`} />
        )}
      </ActionList>
      {view.questions.length ? <AllQuestions questions={view.questions} /> : null}
      {view.guesses.length ? <AllGuesses guesses={view.guesses} /> : null}
    </Card>
  )
}
