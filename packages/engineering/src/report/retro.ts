import type { RetroFact } from '@nook/desk/desks.ts'

import { cut, duration } from '../format.ts'
import type { Engineering } from '../service.ts'
import type { Event } from '../stores/events.ts'

/** `retro`: what went wrong or cost time since a date, each fact from one event of the ledger. */

const MOVES_BACK: Record<string, string> = { reject: 'sent back', reopen: 'reopened', reframe: 'reframed', replan: 'replanned' }

/** The kind of a fact for one event, or null when the event is no fact: an accepted guess, a proven slice. */
function kindOf(e: Event): string | null {
  const reason = e.reason ?? ''
  if (MOVES_BACK[e.type]) return MOVES_BACK[e.type]!
  if (e.type === 'guess' && /^G\d+ flipped\b/.test(reason)) return 'guess flipped'
  if (e.type === 'task' && e.to_state === 'failed') return 'slice failed'
  return null
}

const TEXT_MAX = 160
const SLOW_MS = 30 * 60_000

/** The last proof of each slice, when it is weak or none and falls in the span: a later good proof clears an earlier one. */
function weakProofs(item: string, events: Event[], since: number): RetroFact[] {
  const last = new Map<string, Event>()
  for (const e of events) {
    const slice = e.type === 'prove' ? /^(\S+) (?:proven|weak|none|skipped)\b/.exec(e.reason ?? '')?.[1] : undefined
    if (slice) last.set(slice, e)
  }
  return [...last.values()]
    .filter(e => /^\S+ (?:none|weak):/.test(e.reason ?? '') && Date.parse(e.at) >= since)
    .map(e => ({ item, kind: 'weak proof', text: cut(e.reason ?? '', TEXT_MAX), at: e.at }))
}

/** Each slow blocking question of the span: it waited 30 min or more for the owner, or it still waits. */
function slowQuestions(item: string, events: Event[], since: number): RetroFact[] {
  return events.flatMap(asked => {
    const m = asked.type === 'question' ? /^(Q\d+) asked \(blocking\): (.*)$/.exec(asked.reason ?? '') : null
    if (!m || Date.parse(asked.at) < since) return []
    const [, q, text] = m
    const answered = events.find(e => e.type === 'question' && e.reason?.startsWith(`${q} answered:`))
    const waited = answered ? Date.parse(answered.at) - Date.parse(asked.at) : null
    if (waited !== null && waited < SLOW_MS) return []
    const wait = waited === null ? 'still waits for you' : `waited ${duration(waited)} for you`
    return [{ item, kind: 'slow question', text: cut(`${q} ${wait}: ${text}`, TEXT_MAX), at: asked.at }]
  })
}

export function retroFacts(eng: Engineering, since: Date): RetroFact[] {
  const from = since.getTime()
  return eng.stores.items
    .list()
    .flatMap(item => {
      const events = eng.stores.events.history(item.id)
      const moves = events.flatMap(e => {
        const kind = kindOf(e)
        return kind && Date.parse(e.at) >= from ? [{ item: item.id, kind, text: cut(e.reason ?? '', TEXT_MAX), at: e.at }] : []
      })
      return [...moves, ...weakProofs(item.id, events, from), ...slowQuestions(item.id, events, from)]
    })
    .sort((a, b) => a.at.localeCompare(b.at) || a.item.localeCompare(b.item))
}
