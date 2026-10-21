/** The words of the step that confirms an owner move: what the move is, what it does, and the label of its button. */
export type Confirm = { title: string; body: string; action: string }

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

const GATE_BODY: Record<string, string> = {
  approve: 'The spec, the plan and the slices freeze, and the build can start.',
  accept: 'The item moves to done, and its criteria count as met.',
}
const MODE_BODY: Record<string, string> = {
  yolo: 'The lead runs the stages alone, with no stop at the skill of each stage.',
  normal: 'Each stage waits for its skill again.',
}

/** `fields` are the hidden fields of the form; `chosen` holds the field of the button that sent it and the typed answer. */
export function confirmOf(fields: Record<string, string>, chosen: Record<string, string>): Confirm {
  const item = fields.item ?? ''
  switch (fields.kind) {
    case 'gate': {
      const move = fields.move ?? ''
      return { title: `${capital(move)} ${item}?`, body: `${GATE_BODY[move] ?? ''} It runs the same guards as /gate ${move} ${item}.`.trim(), action: capital(move) }
    }
    case 'back':
      return { title: `Send ${item} back?`, body: `The item goes back to the build, and the lead gets your reason: "${(chosen.reason ?? '').trim()}".`, action: 'Send back' }
    case 'mode': {
      const mode = chosen.mode ?? ''
      return { title: `Switch ${item} to ${mode}?`, body: MODE_BODY[mode] ?? '', action: `Switch to ${mode}` }
    }
    case 'answer':
      return { title: `Send the answer to ${fields.question}?`, body: `"${(chosen.answer ?? '').trim()}" goes to the lead as your answer to ${fields.question} of ${item}.`, action: 'Send' }
    case 'guess':
      return chosen.decision === 'flip'
        ? { title: `Flip ${fields.guess}?`, body: 'The other way wins, and the slices that the guess shaped go back to todo.', action: 'Flip' }
        : { title: `Keep ${fields.guess}?`, body: 'The guess of the lead stands, and the slices that it shaped go on.', action: 'Keep' }
    default:
      return { title: 'Run this move?', body: '', action: 'Run' }
  }
}
