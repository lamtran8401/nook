import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { KIND_TONE } from '@/components/tones.ts'

type Step = BoardCard['state']
export type Phase = { name: string; tone: string; steps: Step[]; about: string }
export type Holder = { key: 'you' | 'lead' | 'ready' | 'backlog' | 'done'; title: string; tone: string; about: string }
export type BoardOptions = { layout: 'board' | 'list'; group: 'phase' | 'holder'; kind: string }

/** The phases of the flow on the board; the backlog has a frame of its own under them. */
export const PHASES: Phase[] = [
  { name: 'Shape', tone: 'violet', steps: ['framing', 'planning'], about: 'The lead writes the spec and the plan; you approve.' },
  { name: 'Build', tone: 'primary', steps: ['ready', 'cooking'], about: 'Builders work slice by slice, test first.' },
  { name: 'Review', tone: 'warning', steps: ['review'], about: 'Verifier and reviewer, then your accept.' },
  { name: 'Done', tone: 'success', steps: ['done'], about: 'Waits for /close, then the wiki.' },
]
export const BACKLOG: Phase = { name: 'Backlog', tone: 'neutral', steps: ['backlog'], about: 'Not started. /triage picks one up.' }
export const HOLDERS: Holder[] = [
  { key: 'you', title: 'Waits for you', tone: 'danger', about: 'A move, an answer or a /close.' },
  { key: 'lead', title: 'The lead runs', tone: 'primary', about: 'Nothing to do until it asks.' },
  { key: 'ready', title: 'Ready to start', tone: 'aqua', about: 'Type /cook to start one.' },
  { key: 'backlog', title: 'Backlog', tone: 'neutral', about: 'Not started. /triage picks one up.' },
  { key: 'done', title: 'Done', tone: 'success', about: 'Closed.' },
]
export const FLOW: Step[] = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'done']
export const KINDS = ['all', ...Object.keys(KIND_TONE)]

/** The step that an item counts in: a blocked item counts in the step that it was blocked from. */
export const stepOf = (card: BoardCard): Step => (card.state === 'blocked' ? (card.blocked_from ?? 'backlog') : card.state)

export const pointsOf = (cards: BoardCard[]): number => cards.reduce((sum, card) => sum + (card.points ?? 0), 0)

/** Who holds the next move: the owner when it is theirs, else the step tells who waits. */
export function holderOf(card: BoardCard): Holder['key'] {
  if (card.next.owner) return 'you'
  const step = stepOf(card)
  if (step === 'done' || step === 'backlog' || step === 'ready') return step
  return 'lead'
}

export const visibleCards = (cards: BoardCard[], kind: string): BoardCard[] => (kind === 'all' ? cards : cards.filter(card => card.kind === kind))

export const phaseColumns = (cards: BoardCard[]) => PHASES.map(phase => ({ phase, cards: cards.filter(card => phase.steps.includes(stepOf(card))) }))

export const backlogOf = (cards: BoardCard[]) => cards.filter(card => stepOf(card) === 'backlog')

/** One part of the lane for each phase: its count, its points, and the items that wait for the owner. */
export const laneOf = (cards: BoardCard[]) =>
  phaseColumns(cards).map(({ phase, cards: held }) => ({ name: phase.name, tone: phase.tone, count: held.length, points: pointsOf(held), waits: held.filter(card => card.next.owner).length }))

/** The holders that hold an item, in the order of HOLDERS. */
export const holderGroups = (cards: BoardCard[]) => HOLDERS.map(holder => ({ holder, cards: cards.filter(card => holderOf(card) === holder.key) })).filter(group => group.cards.length)

/** The phases that hold an item, then the backlog, for the list by phase. */
export const phaseGroups = (cards: BoardCard[]) => [...phaseColumns(cards), { phase: BACKLOG, cards: backlogOf(cards) }].filter(group => group.cards.length)

const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : undefined)

/** The view that the address asks for, such as ?layout=list&group=holder&kind=fix; a word it does not know keeps the default. */
export function boardOptions(params: Record<string, string | string[] | undefined>): BoardOptions {
  const layout = one(params.layout) === 'list' ? 'list' : 'board'
  const group = one(params.group) === 'holder' ? 'holder' : 'phase'
  const kind = KINDS.includes(one(params.kind) ?? '') ? one(params.kind)! : 'all'
  return { layout, group, kind }
}

/** The address of the board with one option changed; a default leaves its word out. */
export function boardHref(base: string, options: BoardOptions, change: Partial<BoardOptions>): string {
  const next = { ...options, ...change }
  const query = new URLSearchParams()
  if (next.layout !== 'board') query.set('layout', next.layout)
  if (next.group !== 'phase') query.set('group', next.group)
  if (next.kind !== 'all') query.set('kind', next.kind)
  const text = query.toString()
  return `${base}/works${text ? `?${text}` : ''}`
}
