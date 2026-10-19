import type { Next } from '@nook/engineering/report/next.ts'

import { ownerGate, turnTitle } from '@/lib/turn.ts'
import { Cmd } from '@/components/Cmd.tsx'
import { Turn } from '@/components/Marks.tsx'
import { Move } from '@/components/item/Move.tsx'

/** A step such as `answer Q3: nook eng answer …`: the words before the colon, and the command after it. */
function splitStep(skill: string): { words: string; command?: string } {
  const at = skill.indexOf(': ')
  return at < 0 ? { words: skill } : { words: skill.slice(0, at), command: skill.slice(at + 2) }
}

/**
 * Who moves the item next, with YOU or AI: a gate of the owner gets its button, which runs the move; another move
 * of the owner names its command; a move of the lead names what it runs and says that nothing waits.
 */
export function NextStep({ next }: { next: Next }) {
  const gate = ownerGate(next)
  const step = splitStep(next.skill)
  return (
    <div className="bn-next">
      <span className="bn-next__label">Next step</span>
      <Turn owner={next.owner} title={turnTitle(next)} />
      {gate ? (
        <>
          <span className="bn-next__text">
            Your move: {gate}
            <small>The button runs the move with the same guards as /gate {gate}.</small>
          </span>
          <Move fields={{ kind: 'gate', item: next.id, move: gate }}>
            <button type="submit" className="bn-btn" data-variant="primary">
              {gate.charAt(0).toUpperCase() + gate.slice(1)}
            </button>
          </Move>
        </>
      ) : next.owner ? (
        <span className="bn-next__text">
          Your move: {step.words}
          <small>{next.detail}</small>
          {step.command ? <Cmd text={step.command} /> : null}
        </span>
      ) : (
        <span className="bn-next__text">
          <span>
            The lead runs <Cmd text={next.skill} />
          </span>
          <small>Nothing waits for you.</small>
        </span>
      )}
    </div>
  )
}
