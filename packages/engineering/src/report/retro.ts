import type { RetroFact } from '@kit/env/env.ts'

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
  if (e.type === 'prove' && /^\S+ (none|weak):/.test(reason)) return 'weak proof'
  return null
}

const duration = (ms: number): string => {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return `${Math.round(ms / 1000)} s`
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`
}

/** Each blocking question of the span: how long it waited for the owner, or that it still waits. */
function questionWaits(item: string, events: Event[], since: number): RetroFact[] {
  return events.flatMap(asked => {
    const m = asked.type === 'question' ? /^(Q\d+) asked \(blocking\): (.*)$/.exec(asked.reason ?? '') : null
    if (!m || Date.parse(asked.at) < since) return []
    const [, q, text] = m
    const answered = events.find(e => e.type === 'question' && e.reason?.startsWith(`${q} answered:`))
    const wait = answered ? `waited ${duration(Date.parse(answered.at) - Date.parse(asked.at))} for you` : 'still waits for you'
    return [{ item, kind: 'question wait', text: `${q} ${wait}: ${text}`, at: asked.at }]
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
        return kind && Date.parse(e.at) >= from ? [{ item: item.id, kind, text: e.reason ?? '', at: e.at }] : []
      })
      return [...moves, ...questionWaits(item.id, events, from)]
    })
    .sort((a, b) => a.at.localeCompare(b.at) || a.item.localeCompare(b.item))
}
