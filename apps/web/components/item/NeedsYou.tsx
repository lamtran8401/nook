import type { ReactNode } from 'react'

import type { ItemView } from '@nook/engineering/read/reader.ts'
import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'

import { clock, day } from '@/lib/time.ts'
import { Records } from '@/components/Records.tsx'
import { Move } from '@/components/item/Move.tsx'

const GUESS_TONE: Record<Guess['status'], string> = { open: 'warning', accepted: 'success', flipped: 'primary' }

function Row({ tone, icon, title, note, under, act }: { tone: string; icon: string; title: string; note: string; under?: ReactNode; act?: ReactNode }) {
  return (
    <li>
      <span className="bn-actions__ico" data-tone={tone}>{icon}</span>
      <div>
        <b>{title}</b>
        <small>{note}</small>
        {under}
      </div>
      <div className="bn-actions__act">{act}</div>
    </li>
  )
}

/** The answer of the owner to an open question, typed on the page. */
function AnswerForm({ item, question }: { item: string; question: Question }) {
  return (
    <Move fields={{ kind: 'answer', item, question: question.id }} className="nk-answer">
      <input className="bn-input" name="answer" placeholder={question.recommended ? `Recommended: ${question.recommended}` : 'Your answer'} aria-label={`Answer to ${question.id}`} required />
      <button type="submit" className="bn-btn" data-size="sm" data-variant="outline">Answer</button>
    </Move>
  )
}

/** Keep the guess, or flip it: the slices that it shaped go back to todo. */
function GuessMoves({ item, guess }: { item: string; guess: Guess }) {
  return (
    <Move fields={{ kind: 'guess', item, guess: guess.id }}>
      <button type="submit" name="decision" value="accept" className="bn-btn" data-size="sm" data-variant="outline">Accept</button>
      <button type="submit" name="decision" value="flip" className="bn-btn" data-size="sm" data-variant="ghost">Flip</button>
    </Move>
  )
}

const questionNote = (q: Question) => `${q.blocking ? 'Blocking' : 'Open · blocks nothing'} · asked ${day(q.asked_at)} ${clock(q.asked_at)}${q.recommended ? ` · recommended: ${q.recommended}` : ''}`
const guessNote = (g: Guess) => `Took: ${g.took}. The other way: ${g.other}.${g.slices.length ? ` Shapes ${g.slices.join(', ')}.` : ''}`

const questionState = (q: Question) => (q.status === 'answered' ? { tone: 'success', text: 'answered' } : q.blocking ? { tone: 'danger', text: 'blocking' } : { tone: 'warning', text: 'open' })

function AllQuestions({ questions }: { questions: Question[] }) {
  return (
    <details className="nk-all">
      <summary>All questions · {questions.length}</summary>
      <Records
        rows={questions.map(q => {
          const state = questionState(q)
          return { id: q.id, main: q.text, sub: q.answer ?? `asked ${day(q.asked_at)}`, end: <span className="bn-badge" data-tone={state.tone}>{state.text}</span> }
        })}
      />
    </details>
  )
}

function AllGuesses({ guesses }: { guesses: Guess[] }) {
  return (
    <details className="nk-all">
      <summary>All guesses · {guesses.length}</summary>
      <Records
        rows={guesses.map(g => ({
          id: g.id,
          main: g.question,
          sub: g.answer ?? g.took,
          end: (
            <>
              <span className="bn-badge" data-variant="plain">{g.impact}</span>
              <span className="bn-badge" data-tone={GUESS_TONE[g.status]}>{g.status}</span>
            </>
          ),
        }))}
      />
    </details>
  )
}

/** What waits for the owner first: each open question, the blocking ones on top, each guess to check, and the gate. */
export function NeedsYou({ view }: { view: ItemView }) {
  const { questions, guesses } = view.needs
  const gate = view.next.owner && view.next.skill.startsWith('owner: /gate ') ? view.next.skill.slice('owner: /gate '.length) : null
  return (
    <div className="bn-card nk-needs">
      <h3 className="bn-actions__group">Questions <span className="bn-badge" data-variant="plain">{questions.length} open</span></h3>
      <ul className="bn-actions">
        {questions.length ? questions.map(q => <Row key={q.id} tone={q.blocking ? 'danger' : 'warning'} icon="?" title={`${q.id}: ${q.text}`} note={questionNote(q)} under={<AnswerForm item={view.item.id} question={q} />} />) : <Row tone="neutral" icon="✓" title="No open question" note="The lead asks with nook eng ask; a blocking one stops its slices." />}
      </ul>
      <h3 className="bn-actions__group">Guesses to check <span className="bn-badge" data-variant="plain">{guesses.length}</span></h3>
      <ul className="bn-actions">
        {guesses.length ? guesses.map(g => <Row key={g.id} tone="warning" icon="!" title={`${g.id} · ${g.impact}: ${g.question}`} note={guessNote(g)} act={<GuessMoves item={view.item.id} guess={g} />} />) : <Row tone="neutral" icon="✓" title="No guess to check" note="Each guess of the lead is accepted or flipped." />}
      </ul>
      <h3 className="bn-actions__group">Gate</h3>
      <ul className="bn-actions">
        {gate ? <Row tone="primary" icon="→" title={`Your ${gate.split(' ')[0]} waits`} note={`Use the button of the next step, or type /gate ${gate} in the agent session.`} /> : <Row tone="neutral" icon="→" title="No gate waits for you" note={view.next.owner ? 'First answer the blocking question above.' : `Next: the lead runs ${view.next.skill}.`} />}
      </ul>
      {view.questions.length ? <AllQuestions questions={view.questions} /> : null}
      {view.guesses.length ? <AllGuesses guesses={view.guesses} /> : null}
    </div>
  )
}
