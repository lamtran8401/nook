import type { Guess } from '@nook/engineering/stores/guesses.ts'
import type { Question } from '@nook/engineering/stores/questions.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { Input } from '@nook/ui/components/input.tsx'

import { Move } from '@/components/item/move.tsx'

/** The answer of the owner to an open question, typed on the page. */
export function AnswerForm({ item, question }: { item: string; question: Question }) {
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
export function GuessMoves({ item, guess }: { item: string; guess: Guess }) {
  return (
    <Move fields={{ kind: 'guess', item, guess: guess.id }}>
      <Button type="submit" name="decision" value="accept" size="sm" variant="outline">Accept</Button>
      <Button type="submit" name="decision" value="flip" size="sm" variant="ghost">Flip</Button>
    </Move>
  )
}
