import type { Next } from '@nook/engineering/report/next.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { Input } from '@nook/ui/components/input.tsx'

import { Move } from '@/components/item/move.tsx'
import { ownerGate } from '@/lib/turn.ts'

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/**
 * The moves of the owner at a gate, each through the gate after a confirm. At review the owner can send the item back
 * to the build with a reason; the plan has no move back, so the owner tells the lead what to change in the session.
 */
export function GateBar({ next }: { next: Next }) {
  const gate = ownerGate(next)
  if (!gate) return null
  return (
    <div data-slot="gate-bar" className="flex w-full flex-wrap items-center gap-2">
      {gate === 'accept' ? (
        <Move fields={{ kind: 'back', item: next.id }} className="flex min-w-0 flex-1" grow>
          <Input name="reason" className="min-w-0 flex-1" placeholder="Reason to send it back…" aria-label="Reason to send it back" required />
          <Button type="submit" variant="outline">Send back</Button>
        </Move>
      ) : (
        <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">To change the plan, tell the lead in the agent session.</p>
      )}
      <Move fields={{ kind: 'gate', item: next.id, move: gate }}>
        <Button type="submit">{capital(gate)}</Button>
      </Move>
    </div>
  )
}
