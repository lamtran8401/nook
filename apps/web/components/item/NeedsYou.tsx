import type { ItemView } from '@nook/engineering/read/reader.ts'
import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'

import { clock, day } from '../../lib/time.ts'

const GUESS_TONE: Record<Guess['status'], string> = { open: 'warning', accepted: 'success', flipped: 'primary' }

function Row({ tone, icon, title, note }: { tone: string; icon: string; title: string; note: string }) {
  return (
    <li>
      <span className="bn-actions__ico" data-tone={tone}>{icon}</span>
      <div>
        <b>{title}</b>
        <small>{note}</small>
      </div>
      <span />
    </li>
  )
}

const questionNote = (q: Question) => `${q.blocking ? 'Blocking' : 'Open · blocks nothing'} · asked ${day(q.asked_at)} ${clock(q.asked_at)}${q.recommended ? ` · recommended: ${q.recommended}` : ''}`
const guessNote = (g: Guess) => `Took: ${g.took}. The other way: ${g.other}.${g.slices.length ? ` Shapes ${g.slices.join(', ')}.` : ''}`

function AllQuestions({ questions }: { questions: Question[] }) {
  return (
    <details className="nk-all">
      <summary>All questions · {questions.length}</summary>
      <ul className="bn-records">
        {questions.map(q => (
          <li key={q.id}>
            <span className="bn-records__id">{q.id}</span>
            <div>
              <div className="bn-records__head">
                <span className="bn-badge" data-tone={q.status === 'answered' ? 'success' : q.blocking ? 'danger' : 'warning'}>{q.status === 'answered' ? 'answered' : q.blocking ? 'blocking' : 'open'}</span>
                <span className="bn-records__meta">asked {day(q.asked_at)}</span>
              </div>
              <p>{q.text}</p>
              {q.answer ? <p className="bn-records__sub">{q.answer}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </details>
  )
}

function AllGuesses({ guesses }: { guesses: Guess[] }) {
  return (
    <details className="nk-all">
      <summary>All guesses · {guesses.length}</summary>
      <ul className="bn-records">
        {guesses.map(g => (
          <li key={g.id}>
            <span className="bn-records__id">{g.id}</span>
            <div>
              <div className="bn-records__head">
                <span className="bn-badge" data-tone={GUESS_TONE[g.status]}>{g.status}</span>
                <span className="bn-badge" data-variant="plain">{g.impact}</span>
              </div>
              <p>{g.question}</p>
              <p className="bn-records__sub">{g.answer ?? g.took}</p>
            </div>
          </li>
        ))}
      </ul>
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
        {questions.length ? questions.map(q => <Row key={q.id} tone={q.blocking ? 'danger' : 'warning'} icon="?" title={`${q.id}: ${q.text}`} note={questionNote(q)} />) : <Row tone="neutral" icon="✓" title="No open question" note="The lead asks with nook eng ask; a blocking one stops its slices." />}
      </ul>
      <h3 className="bn-actions__group">Guesses to check <span className="bn-badge" data-variant="plain">{guesses.length}</span></h3>
      <ul className="bn-actions">
        {guesses.length ? guesses.map(g => <Row key={g.id} tone="warning" icon="!" title={`${g.id} · ${g.impact}: ${g.question}`} note={guessNote(g)} />) : <Row tone="neutral" icon="✓" title="No guess to check" note="Each guess of the lead is accepted or flipped." />}
      </ul>
      <h3 className="bn-actions__group">Gate</h3>
      <ul className="bn-actions">
        {gate ? <Row tone="primary" icon="→" title={`Your ${gate.split(' ')[0]} waits`} note={`Type /gate ${gate} in the agent session, or use the button of the next step.`} /> : <Row tone="neutral" icon="→" title="No gate waits for you" note={view.next.owner ? 'First answer the blocking question above.' : `Next: the lead runs ${view.next.skill}.`} />}
      </ul>
      {view.questions.length ? <AllQuestions questions={view.questions} /> : null}
      {view.guesses.length ? <AllGuesses guesses={view.guesses} /> : null}
    </div>
  )
}
