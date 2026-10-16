import type { Size } from '../vocabulary.ts'

/** The range of criteria that a spec of each size proposes; a complex requirement can go over it, with a reason. */
const RANGE: Record<Size, readonly [number, number]> = { S: [1, 3], M: [3, 6], L: [5, 10] }

/** The criteria of a ticket: the list lines under `## Acceptance criteria` of ticket.md. */
export function ticketCriteria(ticket: string | null): number {
  if (ticket === null) return 0
  const section = /^## Acceptance criteria\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(ticket)?.[1] ?? ''
  return section.split('\n').filter(line => /^\s*(?:[-*]|\d+\.)\s+\S/.test(line)).length
}

/** The proposed cap: the ticket's count + 2 for what the spec finds, kept in the range of the size. */
export function criteriaCap(size: Size, fromTicket: number): { cap: number; why: string } {
  const [low, high] = RANGE[size]
  if (!fromTicket) return { cap: high, why: `the top of the range ${low} to ${high} of size ${size}, as the ticket names no criterion` }
  const cap = Math.min(high, Math.max(low, fromTicket + 2))
  return { cap, why: `the ticket's ${fromTicket} + 2, in the range ${low} to ${high} of size ${size}` }
}
