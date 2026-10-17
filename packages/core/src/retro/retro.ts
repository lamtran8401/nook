import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import type { RetroFact } from '@nook/env/env.ts'

/** `nook retro`: the facts since the last retro of an environment, and the file that the retro of today writes. */

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
