import type { RetroFact } from '@nook/desk/desks.ts'

import { duration } from '../format.ts'
import type { Engineering } from '../service.ts'
import type { Event } from '../stores/events.ts'

/** `metrics`: how the flow went in a span, from the events of the ledger. */

/** A share: `part` of `whole`; a whole of 0 means no data. */
export type Share = { part: number; whole: number }
/** Times of one kind: the median, the longest with its item, and how many there were. */
export type Times = { median: number | null; longest: { ms: number; item: string } | null; count: number }
/** One root cause type of the items accepted in a span: how many, which ones, and the time of the last accept. */
export type CauseCount = { type: string; count: number; items: string[]; at: string }
export type Metrics = {
  since: string
  until: string
  rework: Share & { rejects: number }
  firstPass: Share
  sliceRework: Share
  cycle: Times
  approveWait: Times
  acceptWait: Times
  rootCauses: CauseCount[]
}
/** The events of one item, and the root cause type that its submit kept. */
export type History = { item: string; events: Event[]; rootCause?: string | null }

/** The default span of the metrics: the last 30 days. */
export const METRICS_SPAN_MS = 30 * 24 * 60 * 60 * 1000

const time = (e: Event) => Date.parse(e.at)

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function timesOf(spans: { item: string; ms: number }[]): Times {
  const longest = spans.reduce<{ ms: number; item: string } | null>((max, s) => (!max || s.ms > max.ms ? { ms: s.ms, item: s.item } : max), null)
  return { median: median(spans.map(s => s.ms)), longest, count: spans.length }
}

/** The time from the last event of `starts` before `end` to `end`; none when no such event came. */
function waitFor(events: Event[], end: Event, starts: string[]): number | null {
  for (const type of starts) {
    const start = events.filter(e => e.type === type && e.id < end.id).at(-1)
    if (start) return time(end) - time(start)
  }
  return null
}

const waits = (h: History, end: Event, starts: string[]) => {
  const ms = waitFor(h.events, end, starts)
  return ms === null ? [] : [{ item: h.item, ms }]
}

/** The root cause types of the accepted items, the most frequent first, then by name. */
function causesOf(accepted: { h: History; accept: Event }[]): CauseCount[] {
  const counts = new Map<string, CauseCount>()
  for (const { h, accept } of accepted) {
    if (!h.rootCause) continue
    const found = counts.get(h.rootCause) ?? { type: h.rootCause, count: 0, items: [], at: accept.at }
    counts.set(h.rootCause, { ...found, count: found.count + 1, items: [...found.items, h.item], at: accept.at > found.at ? accept.at : found.at })
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
}

/** The metrics of the events from `since` to `until`. An item counts by its events in the span; one wait is one owner move. */
export function metricsOf(histories: History[], since: Date, until: Date): Metrics {
  const inSpan = (e: Event) => time(e) >= since.getTime() && time(e) <= until.getTime()
  const spanOf = (h: History, type: string) => h.events.filter(e => e.type === type && inSpan(e))
  const reviewed = histories.filter(h => spanOf(h, 'submit').length)
  const accepted = histories.flatMap(h => spanOf(h, 'accept').map(accept => ({ h, accept })))
  const tasks = histories.flatMap(h => spanOf(h, 'task'))
  return {
    since: since.toISOString(),
    until: until.toISOString(),
    rework: { part: reviewed.filter(h => spanOf(h, 'reject').length).length, whole: reviewed.length, rejects: histories.flatMap(h => spanOf(h, 'reject')).length },
    firstPass: { part: accepted.filter(({ h, accept }) => !h.events.some(e => e.type === 'reject' && e.id < accept.id)).length, whole: accepted.length },
    sliceRework: { part: tasks.filter(e => e.from_state === 'done').length, whole: tasks.filter(e => e.to_state === 'done').length },
    cycle: timesOf(accepted.map(({ h, accept }) => ({ item: h.item, ms: time(accept) - time(h.events[0]!) }))),
    approveWait: timesOf(histories.flatMap(h => spanOf(h, 'approve').flatMap(e => waits(h, e, ['import', 'agree'])))),
    acceptWait: timesOf(accepted.flatMap(({ h, accept }) => waits(h, accept, ['submit']))),
    rootCauses: causesOf(accepted),
  }
}

/** The metrics of a desk for the span, from each item of its ledger. */
export const deskMetrics = (eng: Engineering, since: Date, until = new Date()): Metrics =>
  metricsOf(eng.stores.items.list().map(item => ({ item: item.id, events: eng.stores.events.history(item.id), rootCause: item.root_cause })), since, until)

const LABEL = 12
const share = (s: Share, words: string) => (s.whole ? `${Math.round((s.part / s.whole) * 100)}%  ${s.part} of ${s.whole} ${words}` : 'no data')
const times = (t: Times, noun: string) =>
  t.median === null || !t.longest ? 'no data' : `median ${duration(t.median)} · longest ${duration(t.longest.ms)} (${t.longest.item}) · ${t.count} ${noun}`

/** One line for each metric, its value first, under the span. */
export function metricsText(m: Metrics): string {
  return [
    `span ${m.since.slice(0, 10)} to ${m.until.slice(0, 10)}`,
    ['rework rate', m.rework.whole ? `${share(m.rework, 'reviewed items sent back')}, ${m.rework.rejects} rejects` : 'no data'],
    ['first pass', share(m.firstPass, 'accepted items with no send-back')],
    ['slice rework', share(m.sliceRework, 'done slices reopened')],
    ['cycle time', times(m.cycle, 'items')],
    ['approve wait', times(m.approveWait, 'approves')],
    ['accept wait', times(m.acceptWait, 'accepts')],
    ['root causes', m.rootCauses.length ? m.rootCauses.map(c => `${c.type} ${c.count}`).join(' · ') : 'no data'],
  ]
    .map(line => (typeof line === 'string' ? line : `${line[0]!.padEnd(LABEL)}  ${line[1]}`))
    .join('\n')
}

/** The root causes of a span as facts of the retro: one for each type, with its count and its items. */
export const rootCauseFacts = (m: Metrics): RetroFact[] =>
  m.rootCauses.map(c => ({ kind: 'root causes', item: c.type, text: `${c.count} accepted: ${c.items.join(', ')}`, at: c.at }))
