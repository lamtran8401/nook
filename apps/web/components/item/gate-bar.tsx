import type { ItemView } from '@nook/engineering/read/reader.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { DoorNotes } from '@nook/ui/components/door-notes.tsx'
import { type Fact, FactsLine } from '@nook/ui/components/facts-line.tsx'
import { Input } from '@nook/ui/components/input.tsx'

import { Move } from '@/components/item/move.tsx'
import { ownerGate } from '@/lib/turn.ts'

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The evidence of a gate: at the plan step what the plan holds; at the accept what is met and what passes. */
function evidence(view: ItemView, gate: 'approve' | 'accept'): Fact[] {
  const live = view.slices.filter(slice => slice.state !== 'cancelled')
  if (gate === 'approve') return [{ label: count(live.length, 'slice', 'slices'), tone: 'neutral' }, { label: count(view.criteria.length, 'criterion', 'criteria'), tone: 'neutral' }]
  const met = view.criteria.filter(c => c.done).length
  const passed = view.checks.filter(c => c.result === 'pass').length
  return [
    { label: `${met} of ${view.criteria.length} criteria met`, tone: met === view.criteria.length ? 'success' : 'warning' },
    { label: `${passed} of ${view.checks.length} checks pass`, tone: passed === view.checks.length ? 'success' : 'danger' },
  ]
}

/** The evidence and the notes of the door that wait for the owner beside a gate move, such as an accept; none with no gate. */
export function GateEvidence({ view }: { view: ItemView }) {
  const gate = ownerGate(view.next)
  if (!gate) return null
  return (
    <>
      <FactsLine facts={evidence(view, gate)} />
      <DoorNotes notes={view.door.move === gate ? view.door.notes : []} />
    </>
  )
}

/**
 * The moves of the owner at a gate, each through the gate after a confirm, with the evidence and the notes of the door
 * beside them. At review the owner can send the item back to the build with a reason; the plan has no move back, so the
 * owner tells the lead what to change in the session.
 */
export function GateBar({ view }: { view: ItemView }) {
  const gate = ownerGate(view.next)
  if (!gate) return null
  return (
    <div data-slot="gate-bar" className="grid w-full gap-2">
      <GateEvidence view={view} />
      <div className="flex w-full flex-wrap items-center gap-2">
        {gate === 'accept' ? (
          <Move fields={{ kind: 'back', item: view.next.id }} className="flex min-w-0 flex-1" grow>
            <Input name="reason" className="min-w-0 flex-1" placeholder="Reason to send it back…" aria-label="Reason to send it back" required />
            <Button type="submit" variant="outline">Send back</Button>
          </Move>
        ) : (
          <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">To change the plan, tell the lead in the agent session.</p>
        )}
        <Move fields={{ kind: 'gate', item: view.next.id, move: gate }}>
          <Button type="submit">{capital(gate)}</Button>
        </Move>
      </div>
    </div>
  )
}
