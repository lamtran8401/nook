import type { Next } from '@nook/engineering/report/next.ts'
import { ActionBar } from '@nook/ui/components/action-bar.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'

import { ownerGate } from '@/lib/turn.ts'

/** A step such as `answer Q3: nook eng answer …`: the words before the colon, and the command after it. */
function splitStep(skill: string): { words: string; command?: string } {
  const at = skill.indexOf(': ')
  return at < 0 ? { words: skill } : { words: skill.slice(0, at), command: skill.slice(at + 2) }
}

const GATE_WORDS: Record<string, string> = { approve: 'Approve the plan, and the build can start.', accept: 'Accept the work, or send it back.' }
const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1)
const Words = ({ children }: { children: string }) => <p className="text-[14.5px] font-medium">{children}</p>
const Small = ({ children }: { children: string }) => <small className="text-[12.5px] text-muted-foreground">{children}</small>

/**
 * Who moves the item next, YOU or AI: a gate of the owner says its move, and the gate bar holds its button; another
 * move of the owner names its command; a move of the lead names what it runs and says that nothing waits.
 */
export function NextStep({ next }: { next: Next }) {
  const gate = ownerGate(next)
  const step = splitStep(next.skill)
  if (gate)
    return (
      <ActionBar label="Next · You" mark="YOU">
        <Words>{GATE_WORDS[gate] ?? `${capital(gate)} the item.`}</Words>
      </ActionBar>
    )
  if (next.owner)
    return (
      <ActionBar label="Next · You" mark="YOU" action={step.command ? <CopyCommand text={step.command} /> : undefined}>
        <Words>{next.detail ? `${capital(step.words)}: ${next.detail.replace(/^Q\d+ /, '')}` : capital(step.words)}</Words>
      </ActionBar>
    )
  return (
    <ActionBar label="Next · The lead" mark="AI" action={<CopyCommand text={next.skill} />}>
      <Words>{`The lead runs ${next.skill}.`}</Words>
      <Small>Nothing waits for you.</Small>
    </ActionBar>
  )
}
