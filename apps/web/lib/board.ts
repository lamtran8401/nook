import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { KIND_TONE } from '@/components/tones.ts'
import { ownerGate } from '@/lib/turn.ts'

type Step = BoardCard['state']
export type Phase = { name: string; tone: string; steps: Step[]; about: string; quiet?: true }
export type Holder = { key: 'you' | 'lead' | 'ready' | 'backlog' | 'done'; title: string; tone: string; about: string }
export type View = { key: 'all' | 'mine' | 'running'; name: string; holder?: Holder['key'] }
export type BoardOptions = { view: View['key']; layout: 'board' | 'list'; group: 'phase' | 'holder'; kind: string }

/** The phases of the flow on the board; the backlog has a frame of its own under them. */
export const PHASES: Phase[] = [
  { name: 'Shape', tone: 'violet', steps: ['framing', 'planning'], about: 'The lead writes the spec and the plan; you approve.' },
  { name: 'Build', tone: 'primary', steps: ['ready', 'cooking'], about: 'Builders work slice by slice, test first.' },
  { name: 'Review', tone: 'warning', steps: ['review'], about: 'Verifier and reviewer, then your accept.' },
  { name: 'Done', tone: 'success', steps: ['done'], about: 'Waits for /close, then the wiki.', quiet: true },
]
export const BACKLOG: Phase = { name: 'Backlog', tone: 'neutral', steps: ['backlog'], about: 'Not started. /triage picks one up.', quiet: true }
export const HOLDERS: Holder[] = [
  { key: 'you', title: 'Waits for you', tone: 'danger', about: 'A move, an answer or a /close.' },
  { key: 'lead', title: 'The lead runs', tone: 'primary', about: 'Nothing to do until it asks.' },
  { key: 'ready', title: 'Ready to start', tone: 'aqua', about: 'Type /cook to start one.' },
  { key: 'backlog', title: 'Backlog', tone: 'neutral', about: 'Not started. /triage picks one up.' },
  { key: 'done', title: 'Done', tone: 'success', about: 'Closed.' },
]
export const FLOW: Step[] = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'done']
export const KINDS = ['all', ...Object.keys(KIND_TONE)]
/** The saved views of the board: each keeps the items of one holder. */
export const VIEWS: View[] = [
  { key: 'all', name: 'All items' },
  { key: 'mine', name: 'Needs me', holder: 'you' },
  { key: 'running', name: 'Running', holder: 'lead' },
]

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

/** The items that the view and the kind of the address keep. */
export function visibleCards(cards: BoardCard[], { view, kind }: Pick<BoardOptions, 'view' | 'kind'>): BoardCard[] {
  const holder = VIEWS.find(v => v.key === view)?.holder
  return cards.filter(card => (kind === 'all' || card.kind === kind) && (!holder || holderOf(card) === holder))
}

export const phaseColumns = (cards: BoardCard[]) => PHASES.map(phase => ({ phase, cards: cards.filter(card => phase.steps.includes(stepOf(card))) }))

export const backlogOf = (cards: BoardCard[]) => cards.filter(card => stepOf(card) === 'backlog')

/** A quiet phase (Done, the backlog) folds to a strip while it holds items and none of them waits for the owner. */
export const folds = (phase: Phase, cards: BoardCard[]): boolean => Boolean(phase.quiet) && cards.length > 0 && !cards.some(card => card.next.owner)

/** One part of the lane for each phase: its count, its points, and the items that wait for the owner. */
export const laneOf = (cards: BoardCard[]) =>
  phaseColumns(cards).map(({ phase, cards: held }) => ({ name: phase.name, tone: phase.tone, count: held.length, points: pointsOf(held), waits: held.filter(card => card.next.owner).length }))

/** The holders that hold an item, in the order of HOLDERS. */
export const holderGroups = (cards: BoardCard[]) => HOLDERS.map(holder => ({ holder, cards: cards.filter(card => holderOf(card) === holder.key) })).filter(group => group.cards.length)

/** The phases that hold an item, then the backlog, for the list by phase. */
export const phaseGroups = (cards: BoardCard[]) => [...phaseColumns(cards), { phase: BACKLOG, cards: backlogOf(cards) }].filter(group => group.cards.length)

const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : undefined)

/** The view that the address asks for, such as ?view=mine&layout=list&group=holder&kind=fix; a word it does not know keeps the default. */
export function boardOptions(params: Record<string, string | string[] | undefined>): BoardOptions {
  const view = VIEWS.find(v => v.key === one(params.view))?.key ?? 'all'
  const layout = one(params.layout) === 'list' ? 'list' : 'board'
  const group = one(params.group) === 'holder' ? 'holder' : 'phase'
  const kind = KINDS.includes(one(params.kind) ?? '') ? one(params.kind)! : 'all'
  return { view, layout, group, kind }
}

/** The address of the board with one option changed; a default leaves its word out. */
export function boardHref(base: string, options: BoardOptions, change: Partial<BoardOptions>): string {
  const next = { ...options, ...change }
  const query = new URLSearchParams()
  if (next.view !== 'all') query.set('view', next.view)
  if (next.layout !== 'board') query.set('layout', next.layout)
  if (next.group !== 'phase') query.set('group', next.group)
  if (next.kind !== 'all') query.set('kind', next.kind)
  const text = query.toString()
  return `${base}/works${text ? `?${text}` : ''}`
}

/** The last line of a card: what holds it up or who moves next, and the tone of its dot; a closed item is only done. */
export function flagOf(card: BoardCard): { words: string; tone?: string } {
  const step = stepOf(card)
  if (card.flags[0]) return { words: card.flags[0], tone: 'danger' }
  const gate = ownerGate(card.next)
  if (gate) return { words: `waits for your ${gate}`, tone: 'danger' }
  if (step === 'done') return card.next.skill.startsWith('/close') ? { words: 'waits for /close', tone: 'warning' } : { words: 'done' }
  const skill = card.next.skill.replace(` ${card.id}`, '')
  if (card.next.owner) return { words: skill.split(':')[0]!, tone: 'danger' }
  return { words: `the lead runs ${skill}`, tone: PHASES.find(phase => phase.steps.includes(step))?.tone ?? 'neutral' }
}
