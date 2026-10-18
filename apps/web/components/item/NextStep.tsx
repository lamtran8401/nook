import type { Next } from '@nook/engineering/report/next.ts'

import { Move } from './Move.tsx'

const GATE = /^owner: \/gate (\w+)/

/** Who moves the item next: a gate of the owner gets its button, which runs the move; a move of the lead says that nothing waits. */
export function NextStep({ next }: { next: Next }) {
  const gate = next.owner ? GATE.exec(next.skill)?.[1] : undefined
  return (
    <div className="bn-next">
      <span className="bn-next__label">Next step</span>
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
          Your move: {next.skill.split(':')[0]}
          <small>{next.detail}</small>
        </span>
      ) : (
        <span className="bn-next__text">
          The lead runs {next.skill}
          <small>Nothing waits for you.</small>
        </span>
      )}
    </div>
  )
}
