import type { ItemMove } from '@nook/engineering/read/reader.ts'

import { clock, day } from '../../lib/time.ts'

const FLOW = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'done']

const Check = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * The states of the flow, each with the last time the item came into it. A blocked or cancelled item marks the
 * state it left, the last state of the flow that it reached.
 */
export function Stepper({ state, moves }: { state: string; moves: ItemMove[] }) {
  const reached = moves.map(m => FLOW.indexOf(m.to)).filter(i => i >= 0)
  const current = FLOW.includes(state) ? FLOW.indexOf(state) : (reached.at(-1) ?? 0)
  return (
    <ol className="bn-stepper nk-flow">
      {FLOW.map((name, i) => {
        const at = moves.findLast(m => m.to === name)?.at
        const step = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        return (
          <li data-state={step} key={name}>
            <span className="bn-stepper__dot">{step === 'done' ? <Check /> : i + 1}</span>
            <span className="bn-stepper__title">{name}</span>
            <span className="bn-stepper__desc">{at && i <= current ? `${day(at)} ${clock(at)}` : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}
