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
