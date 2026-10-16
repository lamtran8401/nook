import { basename } from 'node:path'

import type { BriefLine, Finding } from '@kit/env/env.ts'

/** `kit brief`: what waits for the owner, what is done since yesterday and what runs, in every folder of the list. */

export type BriefFolder = { dir: string; lines: BriefLine[] }

/** Where the lines of one folder come from: the gaps of the doctor, and the lines of the packs on there. */
export type BriefSources = { gaps: (dir: string) => Finding[]; lines: (dir: string, since: Date) => BriefLine[] }

/** A broken setup comes first: each gap of the doctor is an urgent wait with its fix. A gap that folders share shows once. */
export function collectBrief(dirs: string[], since: Date, sources: BriefSources): BriefFolder[] {
  const seen = new Set<string>()
  return dirs.map(dir => {
    const gaps = sources
      .gaps(dir)
      .filter(f => f.level !== 'ok')
      .filter(f => {
        const key = `${f.text}\n${f.fix ?? ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(f => ({ part: 'waits' as const, urgent: true, text: f.text, ...(f.fix ? { action: f.fix } : {}) }))
    return { dir, lines: [...gaps, ...sources.lines(dir, since)] }
  })
}

const PARTS: { part: BriefLine['part']; title: string }[] = [
  { part: 'waits', title: 'Waits for you' },
  { part: 'done', title: 'Done since yesterday' },
  { part: 'runs', title: 'Runs' },
]

/** The brief as chat text: the waits first, the urgent ones on top; each line with its action; the folder named when there are more. */
export function formatBrief(folders: BriefFolder[]): string {
  const named = folders.length > 1
  const all = folders.flatMap(f => f.lines.map(line => ({ line, folder: basename(f.dir) })))
  const sections = PARTS.map(({ part, title }) => {
    const lines = all.filter(l => l.line.part === part).sort((a, b) => Number(b.line.urgent ?? false) - Number(a.line.urgent ?? false))
    const rows = lines.map(({ line, folder }) => `- ${named ? `${folder}: ` : ''}${line.text}${line.action ? ` → ${line.action}` : ''}`)
    return { part, block: rows.length ? [title, ...rows].join('\n') : '' }
  })
  const blocks = sections.filter(s => s.block).map(s => s.block)
  if (!sections.find(s => s.part === 'waits')!.block) blocks.unshift('Nothing waits for you.')
  return blocks.join('\n\n')
}

/** The midnight that starts the day before `now`, in local time: the brief shows what is done since then. */
export function startOfYesterday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
}
