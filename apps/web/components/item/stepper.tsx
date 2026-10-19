import type { ItemMove } from '@nook/engineering/read/reader.ts'
import { Stepper as KitStepper } from '@nook/ui/components/stepper.tsx'

import { clock, day } from '@/lib/time.ts'

const FLOW = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'done']

/**
 * The states of the flow, each with the last time the item came into it. A blocked or cancelled item marks the
 * state it left, the last state of the flow that it reached.
 */
export function Stepper({ state, moves }: { state: string; moves: ItemMove[] }) {
  const reached = moves.map(m => FLOW.indexOf(m.to)).filter(i => i >= 0)
  const current = FLOW.includes(state) ? FLOW.indexOf(state) : (reached.at(-1) ?? 0)
  return (
    <KitStepper
      steps={FLOW.map((name, i) => {
        const at = moves.findLast(m => m.to === name)?.at
        return { key: name, label: name, state: i < current ? 'done' : i === current ? 'current' : 'upcoming', desc: at && i <= current ? `${day(at)} ${clock(at)}` : undefined }
      })}
    />
  )
}
