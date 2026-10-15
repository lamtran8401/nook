import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { answeredQuestions, emptySections, isFilled, parseSpec } from '../docs/spec.ts'
import { dependsCycle, parseTasks } from '../docs/tasks.ts'
import { currentBranch, isRepo } from '../git.ts'
import { areaDir, workDir } from '../home.ts'
import type { Kit } from '../kit.ts'
import { verifiedAt } from './checks.ts'
import { criteria } from './criteria.ts'
import { type Item, lastEvent, listItems } from './items.ts'
import { openBlocking } from './questions.ts'
import { liveSlices, same, type Slice } from './slices.ts'

/** The guards of the forward moves. Each gap names what is missing and the command that fixes it. */

export type Gap = { text: string; fix: string }
export type Doc = 'spec.md' | 'plan.md' | 'tasks.md'
export const DOCS: Doc[] = ['spec.md', 'plan.md', 'tasks.md']
const PLAN_SECTIONS = ['Architecture', 'Design', 'Steps', 'Tests', 'Risks']

export const docPath = (kit: Kit, id: string, doc: Doc | 'findings.md' | 'handoff.md') => join(workDir(kit.home, id), doc)
export const readDoc = (kit: Kit, id: string, doc: Doc | 'findings.md' | 'handoff.md'): string | null =>
  existsSync(docPath(kit, id, doc)) ? readFileSync(docPath(kit, id, doc), 'utf8') : null

export const hashOf = (text: string | null) => (text === null ? 'missing' : createHash('sha256').update(text).digest('hex'))

export const FORWARD: Partial<Record<Item['state'], string>> = { backlog: 'start', framing: 'agree', planning: 'approve', ready: 'begin', cooking: 'submit', checking: 'accept' }

/** The gaps of one move. Moves with no guard give none. */
export function gaps(kit: Kit, item: Item, move: string): Gap[] {
  switch (move) {
    case 'agree': return agreeGaps(kit, item)
    case 'approve': return approveGaps(kit, item)
    case 'proceed': return [...proceedGaps(kit, item), ...approveGaps(kit, item)]
    case 'begin': return beginGaps(kit, item)
    case 'submit': return submitGaps(kit, item)
    case 'accept': return acceptGaps(kit, item)
    default: return []
  }
}

function questionGaps(kit: Kit, item: Item): Gap[] {
  return openBlocking(kit, item.id).map(q => ({ text: `${q.id} is open and blocking: ${q.text}`, fix: `ask the owner, then kit eng answer ${item.id} ${q.id} "<answer>"` }))
}

function agreeGaps(kit: Kit, item: Item): Gap[] {
  const file = docPath(kit, item.id, 'spec.md')
  const text = readDoc(kit, item.id, 'spec.md')
  if (text === null) return [{ text: 'spec.md is missing', fix: `kit eng item start ${item.id} scaffolds it` }]
  const spec = parseSpec(text)
  const found: Gap[] = spec.problems.map(p => ({ text: `spec.md: ${p}`, fix: `edit ${file}` }))
  const kind = spec.kind ?? item.kind
  if (kind === 'investigate') {
    if (!spec.questions.length) found.push({ text: 'spec.md: an investigate item needs at least one question under ## Questions', fix: `edit ${file}` })
  } else if (!spec.criteria.length) found.push({ text: 'spec.md: no acceptance criterion', fix: `add a \`- [ADD] text\` line under ## Acceptance criteria in ${file}` })
  const known = new Set(kit.home.config.areas.map(a => a.name))
  for (const area of spec.areas) if (!known.has(area)) found.push({ text: `spec.md: area "${area}" is not in kit.yml`, fix: `fix the name in ${file}, or add the area with /setup` })
  return [...found, ...questionGaps(kit, item)]
}

function approveGaps(kit: Kit, item: Item): Gap[] {
  const found: Gap[] = [...planGaps(kit, item)]
  if (item.kind !== 'investigate') found.push(...sliceGaps(kit, item))
  return [...found, ...questionGaps(kit, item)]
}

function planGaps(kit: Kit, item: Item): Gap[] {
  const file = docPath(kit, item.id, 'plan.md')
  const text = readDoc(kit, item.id, 'plan.md')
  if (text === null) return [{ text: 'plan.md is missing', fix: `write ${file}` }]
  if (!isFilled(text)) return [{ text: 'plan.md is the template, not a plan', fix: `write the sections of ${file}` }]
  return emptySections(text, PLAN_SECTIONS).map(name => ({ text: `plan.md: ## ${name} is empty`, fix: `write it in ${file}` }))
}

function sliceGaps(kit: Kit, item: Item): Gap[] {
  const id = item.id
  const file = docPath(kit, id, 'tasks.md')
  const text = readDoc(kit, id, 'tasks.md')
  if (text === null) return [{ text: 'tasks.md is missing', fix: `write ${file}, then kit eng task import ${id}` }]
  const parsed = parseTasks(text)
  if (parsed.problems.length) return parsed.problems.map(p => ({ text: `tasks.md: ${p}`, fix: `fix the line in ${file}, then kit eng task import ${id}` }))
  const found: Gap[] = []
  const live = liveSlices(kit, id)
  if (!parsed.slices.length) found.push({ text: 'tasks.md has no slice', fix: `write \`## T1: title\` with area, depends, acs, size, done when in ${file}, then kit eng task import ${id}` })
  const differ = parsed.slices.filter(spec => !live.some(s => s.id === spec.id && same(s, spec))).map(s => s.id)
  const extra = live.filter(s => !parsed.slices.some(spec => spec.id === s.id)).map(s => s.id)
  if (differ.length || extra.length) found.push({ text: `tasks.md and the ledger differ: ${[...differ, ...extra].join(', ')}`, fix: `kit eng task import ${id}` })
  for (const c of criteria(kit, id)) {
    if (!parsed.slices.some(s => s.acs.includes(c.n))) found.push({ text: `AC ${c.n} is in no slice: ${c.text}`, fix: `add ${c.n} to the acs: line of a slice in ${file}, then kit eng task import ${id}` })
  }
  for (const s of parsed.slices) {
    if (!item.areas.includes(s.area)) found.push({ text: `${s.id}: area ${s.area} is not an area of ${id} (${item.areas.join(', ') || 'none'})`, fix: `fix area: in ${file}, or add the area to the spec front matter and reframe` })
  }
  const cycle = dependsCycle(parsed.slices)
  if (cycle) found.push({ text: `depends has a cycle: ${cycle.join(' → ')}`, fix: `break it in ${file}, then kit eng task import ${id}` })
  return found
}

/** The owner set the mode: the item is in auto, and the last `mode` event has the role owner. */
export function ownerStartedAuto(kit: Kit, item: Item): boolean {
  return item.mode === 'auto' && lastEvent(kit, item.id, 'mode')?.role === 'owner'
}

function proceedGaps(kit: Kit, item: Item): Gap[] {
  if (ownerStartedAuto(kit, item)) return []
  return [{ text: `${item.id} is not in an auto run that the owner started (mode ${item.mode})`, fix: `owner: kit eng item mode ${item.id} auto, or owner: kit eng item approve ${item.id}` }]
}

export function approvedHashes(kit: Kit, id: string): Map<string, string> {
  const rows = kit.db.query('SELECT document, hash FROM approval WHERE item = ?').all(id) as { document: string; hash: string }[]
  return new Map(rows.map(r => [r.document, r.hash]))
}

/** A document that changed after the approve. */
export function driftGaps(kit: Kit, item: Item, docs: Doc[] = DOCS): Gap[] {
  if (item.quick) return []
  const approved = approvedHashes(kit, item.id)
  return docs
    .filter(doc => approved.has(doc) && approved.get(doc) !== hashOf(readDoc(kit, item.id, doc)))
    .map(doc => ({ text: `${doc} changed after the approve`, fix: `kit eng item replan ${item.id}` }))
}

/** The item in cooking that uses an area, other than `item`. */
export function areaInUse(kit: Kit, item: Item, area: string): Item | undefined {
  return listItems(kit, 'cooking').find(other => other.id !== item.id && other.areas.includes(area))
}

export function beginGaps(kit: Kit, item: Item): Gap[] {
  const found: Gap[] = driftGaps(kit, item)
  for (const name of item.areas) {
    const area = kit.home.config.areas.find(a => a.name === name)
    if (!area) {
      found.push({ text: `area ${name} is not in kit.yml`, fix: 'add it with /setup' })
      continue
    }
    const dir = areaDir(kit.home, area)
    if (area.git && isRepo(dir)) {
      const branch = currentBranch(dir)
      if (!branch || kit.home.config.protected.includes(branch)) found.push({ text: `area ${name} is on ${branch ?? 'no branch'}, a protected branch`, fix: `kit eng item branch ${item.id}` })
    }
    const other = areaInUse(kit, item, name)
    if (other) found.push({ text: `area ${name} is in use by ${other.id}`, fix: `wait for ${other.id}, or move ${item.id} to another area: kit eng item edit ${item.id} areas <a>` })
  }
  return found
}

function submitGaps(kit: Kit, item: Item): Gap[] {
  const found: Gap[] = driftGaps(kit, item, ['spec.md'])
  if (item.kind === 'investigate') {
    const text = readDoc(kit, item.id, 'findings.md')
    if (!text || !isFilled(text)) found.push({ text: 'findings.md is not filled', fix: `write ## Q<n> with Answer, Evidence, Open in ${docPath(kit, item.id, 'findings.md')}` })
    return found
  }
  const live = liveSlices(kit, item.id)
  if (!live.some(s => s.state === 'done')) found.push({ text: 'no slice is done', fix: `kit eng task done ${item.id} <T> --files <f...>` })
  for (const s of live.filter(s => s.state !== 'done')) found.push({ text: `${s.id} is ${s.state}`, fix: sliceFix(item.id, s) })
  if (!verifiedAt(kit, item)) found.push({ text: 'the checks have not passed since the last move back', fix: `kit eng item verify ${item.id}` })
  return found
}

function sliceFix(id: string, s: Slice): string {
  if (s.state === 'failed') return `kit eng task retry ${id} ${s.id}, or kit eng task cancel ${id} ${s.id} --reason "<why>"`
  if (s.state === 'waiting') return `answer what it waits for, then kit eng task resume ${id} ${s.id}`
  return `kit eng task done ${id} ${s.id} --files <f...>`
}

/** Done slices with no proof: a warning at submit, not a gap. */
export function proofWarnings(kit: Kit, item: Item): string[] {
  return liveSlices(kit, item.id).filter(s => s.state === 'done' && (s.proof === 'none' || s.proof === 'weak')).map(s => `${s.id} is done with proof ${s.proof}${s.proof_note ? ` (${s.proof_note})` : ''}`)
}

function acceptGaps(kit: Kit, item: Item): Gap[] {
  const found: Gap[] = driftGaps(kit, item, ['spec.md'])
  if (item.kind === 'investigate') return [...found, ...findingsGaps(kit, item)]
  const marks = criteria(kit, item.id)
  if (!marks.length) found.push({ text: 'no acceptance criterion', fix: `kit eng item ac add ${item.id} "<text>" --tag ADD` })
  for (const c of marks.filter(c => !c.done)) found.push({ text: `AC ${c.n} is not met: ${c.text}`, fix: `kit eng item ac done ${item.id} ${c.n} --evidence "<what shows it>" --grade run|sourced|judged|owner` })
  // the mark holds the text as it was: a criterion whose text changed since needs a new mark
  const spec = readDoc(kit, item.id, 'spec.md')
  if (spec) {
    const lines = parseSpec(spec).criteria
    if (lines.length !== marks.length) found.push({ text: `spec.md has ${lines.length} criteria, the ledger has ${marks.length}`, fix: `kit eng item replan ${item.id}` })
    for (const c of marks.filter(c => c.done)) {
      const line = lines[c.n - 1]
      if (line && line.text !== c.text) found.push({ text: `AC ${c.n} was marked for another text: "${c.text}" is now "${line.text}"`, fix: `kit eng item ac undo ${item.id} ${c.n}, then ac done with new evidence` })
    }
  }
  if (item.quick && !verifiedAt(kit, item)) found.push({ text: 'the checks have not passed', fix: `kit eng item verify ${item.id}` })
  return found
}

function findingsGaps(kit: Kit, item: Item): Gap[] {
  const spec = readDoc(kit, item.id, 'spec.md')
  const questions = spec ? parseSpec(spec).questions : []
  const answered = answeredQuestions(readDoc(kit, item.id, 'findings.md') ?? '')
  return questions.map((q, i) => i + 1).filter(n => !answered.has(n)).map(n => ({ text: `Q${n} has no answer with evidence in findings.md: ${questions[n - 1]}`, fix: `write ## Q${n} with Answer and Evidence in ${docPath(kit, item.id, 'findings.md')}` }))
}

export const formatGaps = (found: Gap[]) => found.map(g => `- ${g.text}\n    fix: ${g.fix}`).join('\n')
