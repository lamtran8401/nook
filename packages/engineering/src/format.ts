import { match } from 'ts-pattern'

import type { Area } from './config.ts'
import type { BranchResult } from './git/branching.ts'
import type { CommitPlan } from './git/commits.ts'
import type { Gap } from './guards/guard.ts'
import type { AreaStatus } from './report/areas.ts'
import type { BriefLine } from './report/brief.ts'
import type { Finding } from './report/doctor.ts'
import type { Next } from './report/next.ts'
import type { ImportReport, NextGaps } from './service.ts'
import type { Adr } from './stores/adrs.ts'
import type { CheckRun } from './stores/checks.ts'
import type { Criterion } from './stores/criteria.ts'
import type { Event } from './stores/events.ts'
import type { Guess } from './stores/guesses.ts'
import type { Item } from './stores/items.ts'
import type { Note } from './stores/notes.ts'
import type { Question } from './stores/questions.ts'
import type { Slice } from './stores/slices.ts'


const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
const orNone = (lines: string[], none: string) => lines.join('\n') || none

export const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

export const itemLine = (i: Item) =>
  `${i.id.padEnd(10)} ${i.state.padEnd(9)} ${i.kind} ${i.size}  ${i.title}${i.areas.length ? `  [${i.areas.join(', ')}]` : ''}${i.mode === 'yolo' ? '  (yolo)' : ''}`

export const itemList = (items: Item[]) => (items.length ? items.map(itemLine).join('\n') : 'no items')

export const sliceLine = (s: Slice) =>
  `${s.id.padEnd(4)} ${s.state.padEnd(9)} ${s.area.padEnd(10)} ${s.title}${s.acs.length ? `  acs ${s.acs.join(',')}` : ''}` +
  `${s.depends.length ? `  after ${s.depends.join(',')}` : ''}${s.assignee ? `  by ${s.assignee}` : ''}  proof ${s.proof}`

export const sliceList = (slices: Slice[]) => orNone(slices.map(sliceLine), 'no slices')

export const sliceDetail = (s: Slice) =>
  `${sliceLine(s)}\n${s.files.length ? `files: ${s.files.join(', ')}\n` : ''}${s.reason ? `reason: ${s.reason}\n` : ''}${s.proof_note ? `proof: ${s.proof_note}` : ''}`

export const formatGaps = (found: Gap[]) => found.map(g => `- ${g.text}\n    fix: ${g.fix}`).join('\n')

/** The refusal of a move: the count of gaps, then each gap with its fix. */
export const gapsHeading = (move: string, id: string, found: Gap[]) =>
  `${move} ${id}: ${plural(found.length, 'gap')}\n${formatGaps(found)}`

export function nextGapsText(r: NextGaps): string {
  if (!r.move) return `${r.id} is ${r.state}: no forward move`
  return r.gaps.length ? gapsHeading(r.move, r.id, r.gaps) : `${r.move} ${r.id}: no gap`
}

export const eventList = (events: Event[]) =>
  orNone(
    events.map(
      e =>
        `${e.at}  ${e.type.padEnd(8)} ${e.from_state ?? '-'} → ${e.to_state ?? '-'}  ${e.actor} (${e.role})${e.reason ? `  ${e.reason}` : ''}`,
    ),
    'no events',
  )

export const criterionList = (all: Criterion[]) =>
  orNone(
    all.map(
      a => `${a.done ? '[x]' : '[ ]'} ${a.n} ${a.text}${a.done ? `  (${a.grade}: ${a.evidence})` : ''}`,
    ),
    'no criteria',
  )

const COUNT = /(\d+)\s+(pass(?:ed)?|fail(?:ed)?|skip(?:ped)?|todo)\b/gi

/** The test counts that a check printed, such as `19 pass, 0 fail`; empty when it printed none. */
export function testCounts(output: string): string {
  return output
    .split('\n')
    .flatMap(line => [...line.matchAll(COUNT)].map(m => `${m[1]} ${m[2]}`))
    .join(', ')
}

export const runText = (run: CheckRun[]) => {
  if (!run.length) return 'no run yet'
  return run
    .map(
      r =>
        `${r.result === 'pass' ? '✓' : '✗'} ${r.area}: ${r.check}${testCounts(r.output) ? ` (${testCounts(r.output)})` : ''}${r.result === 'fail' ? `\n${tail(r.output)}` : ''}`,
    )
    .join('\n')
}

const tail = (output: string) =>
  output
    .trim()
    .split('\n')
    .slice(-8)
    .map(l => `    ${l}`)
    .join('\n')

export const branchList = (all: BranchResult[]) =>
  all.map(r => `${r.area}: ${r.made ? 'made' : 'on'} ${r.branch}`).join('\n')

export function commitText(plan: CommitPlan, id: string, ran: boolean): string {
  const lines = [
    ...plan.entries.map(
      e =>
        `${e.commit ? `${e.commit} ` : ''}${e.area} (${e.branch ?? 'no branch'}): ${e.message}\n    ${e.files.join(', ')}`,
    ),
    ...plan.skipped.map(s => `skipped: ${s}`),
    plan.entries.length && !ran ? `run them: nook eng item commit ${id} --run` : '',
  ]
  return lines.filter(Boolean).join('\n') || 'nothing to commit'
}

export const importText = (r: ImportReport) =>
  [
    `created: ${r.created.join(', ') || '-'}`,
    `updated: ${r.updated.join(', ') || '-'}`,
    `cancelled: ${r.cancelled.join(', ') || '-'}`,
    r.kept.length ? `kept: ${r.kept.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

export const questionList = (all: Question[]) =>
  orNone(
    all.map(
      q =>
        `${q.item} ${q.id} ${q.status}${q.blocking ? ' blocking' : ''}: ${q.text}${q.recommended ? ` (rec: ${q.recommended})` : ''}${q.answer ? ` → ${q.answer}` : ''}`,
    ),
    'no questions',
  )

export const guessList = (all: Guess[]) =>
  orNone(
    all.map(
      g =>
        `${g.item} ${g.id} ${g.status} (${g.impact}): ${g.question} → took "${g.took}", not "${g.other}"${g.slices.length ? ` [${g.slices.join(', ')}]` : ''}`,
    ),
    'no guesses',
  )

export const noteList = (all: Note[]) =>
  orNone(
    all.map(n => `${n.at}  ${n.by}: ${n.text}`),
    'no notes',
  )

export const adrList = (all: Adr[]) =>
  orNone(
    all.map(
      a =>
        `${String(a.n).padStart(4, '0')}  ${a.status.padEnd(10)} ${a.title}${a.item ? `  (${a.item})` : ''}${a.by ? `  → ${a.by}` : ''}`,
    ),
    'no ADRs',
  )

export const areaList = (all: Area[]) =>
  orNone(
    all.map(
      a =>
        `${a.name.padEnd(12)} ${a.kind.padEnd(9)} ${a.path}${a.checks ? `  checks: ${a.checks.join(' && ') || 'none'}` : '  checks: MISSING'}${a.git ? '' : '  (no git)'}`,
    ),
    'no areas: add them to nook.yml with /setup',
  )

export const areaStatusList = (all: AreaStatus[]) =>
  orNone(
    all.map(
      a =>
        `${a.area.padEnd(12)} ${a.kind.padEnd(9)} ${a.path}${a.exists ? '' : ' (missing)'}  ${a.branch ?? '-'}  ${a.dirty} dirty${a.item ? `  used by ${a.item}` : ''}`,
    ),
    'no areas',
  )

export const briefList = (all: BriefLine[]) =>
  orNone(
    all.map(l => `${l.urgency.padEnd(5)} ${l.text}\n      ${l.action}`),
    'nothing waits for you',
  )

export function nextText(lines: Next[]): string {
  const waiting = lines.filter(l => l.owner)
  const head = waiting.length
    ? `Waits for you: ${waiting.map(l => `${l.id}: ${l.skill.replace(/^owner: /, '')}`).join('; ')}`
    : 'Nothing waits for you.'
  const rest = lines.map(
    l => `${l.id.padEnd(10)} ${l.state.padEnd(9)} ${l.skill}${l.detail ? `  (${l.detail})` : ''}`,
  )
  return [head, ...rest].join('\n')
}

const findingMark = (level: Finding['level']) =>
  match(level)
    .with('ok', () => '✓')
    .with('error', () => '✗')
    .with('warn', () => '!')
    .exhaustive()

export const findingList = (found: Finding[]) =>
  found.map(f => `${findingMark(f.level)} ${f.text}${f.fix ? `\n    fix: ${f.fix}` : ''}`).join('\n')
