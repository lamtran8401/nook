import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import type { RetroFact } from '@nook/desk/desks.ts'
import type { DeskEvent } from '@nook/desk/events.ts'

/** `nook retro`: the facts since the last retro of a desk, and the file that the retro of today writes. */

const RETRO_DIR = join('docs', 'retro')
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** The time of the newest retro file, so a fact after it on the same day still counts; with no retro, 7 days back. */
export function retroSince(envDir: string, now = new Date()): Date {
  const dir = join(envDir, RETRO_DIR)
  const times = existsSync(dir)
    ? readdirSync(dir)
        .filter(name => name.endsWith('.md'))
        .map(name => statSync(join(dir, name)).mtimeMs)
    : []
  return times.length ? new Date(Math.max(...times)) : new Date(now.getTime() - WEEK_MS)
}

const localDate = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

/** The retro of a day has one file; it says when the file exists, so a second retro of the day adds to it with care. */
export function retroFile(envDir: string, now = new Date()): { path: string; exists: boolean } {
  const path = join(RETRO_DIR, `${localDate(now)}.md`)
  return { path, exists: existsSync(join(envDir, path)) }
}

/** The facts as text, grouped by their kind in the order that each kind first came. */
export function formatFacts(facts: RetroFact[]): string {
  if (!facts.length) return 'Nothing went wrong in the span.'
  const kinds = [...new Set(facts.map(f => f.kind))]
  return kinds
    .map(kind => {
      const of = facts.filter(f => f.kind === kind)
      return [`${kind} (${of.length})`, ...of.map(f => `- ${f.item}: ${f.text}`)].join('\n')
    })
    .join('\n\n')
}

/** The blocks of the guards as facts: each hook and reason once, with its count and its last time, the most frequent first. */
export function blockFacts(events: DeskEvent[]): RetroFact[] {
  return groupFacts(events.filter(e => e.kind === 'block'), 'guard blocks')
}

function groupFacts(events: DeskEvent[], kind: string): RetroFact[] {
  const groups = new Map<string, { hook: string; reason: string; count: number; at: string }>()
  for (const event of events) {
    const key = `${event.hook}\n${event.reason}`
    const group = groups.get(key) ?? { hook: event.hook ?? '', reason: event.reason ?? '', count: 0, at: event.at }
    groups.set(key, { ...group, count: group.count + 1, at: event.at > group.at ? event.at : group.at })
  }
  return [...groups.values()].sort((a, b) => b.count - a.count).map(g => ({ kind, item: g.hook, text: `${g.count}× ${g.reason}`, at: g.at }))
}

/** The errors of the hooks as facts: each hook and message once, with its count, the most frequent first. */
export function errorFacts(events: DeskEvent[]): RetroFact[] {
  return groupFacts(events.filter(e => e.kind === 'error'), 'hook errors')
}

/** One line for each event of the log: its time, then the prompt, or the block or error with its hook, its agent and its command. */
export function eventLines(events: DeskEvent[]): string {
  return events
    .map(e => (e.kind === 'prompt' ? `${e.at}  prompt  ${e.text}` : `${e.at}  ${e.kind.padEnd(6)}  ${e.hook} (${e.agent}): ${e.reason} · ${e.command}`))
    .join('\n')
}
