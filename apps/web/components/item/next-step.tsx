import type { Next } from '@nook/engineering/report/next.ts'
import { ActionBar } from '@nook/ui/components/action-bar.tsx'
import { Button } from '@nook/ui/components/button.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'

import { Move } from '@/components/item/move.tsx'
import { Turn } from '@/components/marks.tsx'
import { ownerGate, turnTitle } from '@/lib/turn.ts'

/** A step such as `answer Q3: nook eng answer …`: the words before the colon, and the command after it. */
function splitStep(skill: string): { words: string; command?: string } {
  const at = skill.indexOf(': ')
  return at < 0 ? { words: skill } : { words: skill.slice(0, at), command: skill.slice(at + 2) }
}

const Small = ({ children }: { children: string }) => <small className="text-[13px] text-muted-foreground">{children}</small>

/**
 * Who moves the item next, with YOU or AI: a gate of the owner gets its button, which runs the move; another move
 * of the owner names its command; a move of the lead names what it runs and says that nothing waits.
 */
export function NextStep({ next }: { next: Next }) {
  const gate = ownerGate(next)
  const step = splitStep(next.skill)
  const mark = <Turn owner={next.owner} title={turnTitle(next)} />
  if (gate)
    return (
      <ActionBar
        label="Next step"
        mark={mark}
        action={
          <Move fields={{ kind: 'gate', item: next.id, move: gate }}>
            <Button type="submit">{gate.charAt(0).toUpperCase() + gate.slice(1)}</Button>
          </Move>
        }
      >
        <p className="text-[15px] font-medium">Your move: {gate}</p>
        <Small>{`The button runs the move with the same guards as /gate ${gate}.`}</Small>
      </ActionBar>
    )
  if (next.owner)
    return (
      <ActionBar label="Next step" mark={mark}>
        <p className="text-[15px] font-medium">Your move: {step.words}</p>
        <Small>{next.detail}</Small>
        {step.command ? <CopyCommand text={step.command} /> : null}
      </ActionBar>
    )
  return (
    <ActionBar label="Next step" mark={mark}>
      <p className="text-[15px] font-medium">The lead runs <CopyCommand text={next.skill} /></p>
      <Small>Nothing waits for you.</Small>
    </ActionBar>
  )
}
