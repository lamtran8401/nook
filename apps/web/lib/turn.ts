import type { Next } from '@nook/engineering/report/next.ts'

const GATE = /^owner: \/gate (approve|accept)\b/

/** The gate of the owner that the next step names, such as approve; none for any other step. */
export const ownerGate = (next: Pick<Next, 'owner' | 'skill'>): 'approve' | 'accept' | undefined =>
  next.owner ? (GATE.exec(next.skill)?.[1] as 'approve' | 'accept' | undefined) : undefined

/** The next step in a few words: the move of the owner, such as answer Q2, or what the lead runs. */
export function turnTitle(next: Pick<Next, 'owner' | 'skill'>): string {
  if (!next.owner) return `The lead runs ${next.skill}`
  return `Your move: ${ownerGate(next) ?? next.skill.split(':')[0]}`
}
