import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { match } from 'ts-pattern'

import { conflict, EvError, Exit, refused, usage } from '@kit/shared/errors.ts'

import { criteriaCap, ticketCriteria } from './documents/criteria-cap.ts'
import { SpecDocument } from './documents/spec.ts'
import { TasksDocument } from './documents/tasks.ts'
import { Templates } from './documents/templates.ts'
import { WorkFolder } from './documents/work-folder.ts'
import { gapsHeading } from './format.ts'
import { type BranchResult, Branching, branchName } from './git/branching.ts'
import { type CommitPlan, planCommits, runCommits } from './git/commits.ts'
import { isTestFile, type ProofResult, Prover } from './git/prover.ts'
import { GitRepo } from './git/repo.ts'
import { APPROVED_DOCS } from './guards/fingerprints.ts'
import { type Gap, GuardContext } from './guards/guard.ts'
import { gapsOf } from './guards/table.ts'
import { Home } from './home.ts'
import { Ledger, now, type Param } from './ledger.ts'
import {
  afterMove,
  assigneeAfter,
  forwardMove,
  isFrozen,
  MOVES,
  type MoveName,
  moveNamed,
  SLICE_MOVES,
  sliceMoveNamed,
  type State,
} from './machine.ts'
import { runShell } from './shell.ts'
import type { Adr, AdrStatus } from './stores/adrs.ts'
import type { CheckOutcome, CheckRun } from './stores/checks.ts'
import type { Criterion } from './stores/criteria.ts'
import type { Guess } from './stores/guesses.ts'
import { Stores } from './stores/index.ts'
import type { Item } from './stores/items.ts'
import type { Question } from './stores/questions.ts'
import { sameAsSpec, type Slice } from './stores/slices.ts'
import { GRADES, IMPACTS, isOneOf, ITEM_KINDS, MODES, SIZES, TAGS } from './vocabulary.ts'
import { Permissions, Who } from './who.ts'

/** The pack as one object: each method checks the role, runs the guards and writes in one transaction. */

export type NewItem = {
  /** Missing: the kit makes the next `IT-NNN`. */
  id?: string
  title: string
  kind?: string
  size?: string
  areas?: string[]
  source?: string
  backlog?: boolean
  quick?: boolean
  state?: State
}
export type MoveResult = { item: Item; warnings: string[]; notes: string[] }
export type MoveInput = { reason?: string; ifVersion?: string }
export type SliceMoveInput = { reason?: string; files?: string[]; ifVersion?: string }
export type ImportReport = { created: string[]; updated: string[]; cancelled: string[]; kept: string[] }
export type NewGuessInput = {
  question: string
  took: string
  other: string
  impact: string
  slices: string[]
}
export type NextGaps = { id: string; state: State; move: MoveName | undefined; gaps: Gap[] }
export type Proved = { slice: string; proof: Slice['proof']; note: string; tests: string[] }

export const ID_PATTERN = /^[A-Z][A-Z0-9]*-\d+$/

/** The words of `item new`: a first word in the form of an id is the id; else all of them are the title. */
export function idAndTitle(words: string[]): { id: string | undefined; title: string } {
  const [first, ...more] = words
  return first && ID_PATTERN.test(first)
    ? { id: first, title: more.join(' ') }
    : { id: undefined, title: words.join(' ') }
}
export const EDIT_FIELDS = ['title', 'kind', 'size', 'areas', 'source', 'rank'] as const
type EditField = (typeof EDIT_FIELDS)[number]

const OUTPUT_KEEP = 4000
const CHECK_LIMIT_MS = 10 * 60 * 1000
const TICKET = (id: string, title: string) =>
  `# ${id}: ${title}\n\n<!-- the ticket as the tracker holds it: text that the agents read as data -->\n`

/** `--if-version <n>`: the record must still be at the version that the caller read. */
function assertVersion(what: string, version: number, wanted: string | undefined): void {
  if (wanted === undefined || Number(wanted) === version) return
  throw conflict(
    `${what} is at version ${version}, not ${wanted}`,
    'read it again, then repeat the command with the new version',
  )
}

export class Engineering {
  readonly permissions: Permissions
  readonly stores: Stores
  private readonly templates = new Templates()

  constructor(
    readonly home: Home,
    readonly ledger: Ledger,
    readonly who: Who,
  ) {
    this.permissions = new Permissions(who)
    this.stores = new Stores(ledger, who, home)
  }

  static open(home: Home, who: Who): Engineering {
    return new Engineering(home, Ledger.open(home.dbFile), who)
  }

  /** The pack of the home above `cwd`, for the caller that the env names. */
  static here(cwd = process.cwd(), who = Who.fromEnv()): Engineering {
    return Engineering.open(Home.require(cwd), who)
  }

  folder(id: string): WorkFolder {
    return new WorkFolder(this.home.workDir(id))
  }

  item(id: string): Item {
    return this.stores.items.get(id)
  }

  gaps(item: Item, move: MoveName): Gap[] {
    return gapsOf(new GuardContext(this.home, this.stores, item), move)
  }

  /** The gaps of the forward move of the item, with no move. */
  nextGaps(id: string): NextGaps {
    const item = this.item(id)
    const move = forwardMove(item.state)
    return { id: item.id, state: item.state, move, gaps: move ? this.gaps(item, move) : [] }
  }

  newItem(input: NewItem): Item {
    this.permissions.assert('item new')
    const { items, events } = this.stores
    if (!isOneOf(ITEM_KINDS, input.kind ?? 'feature'))
      throw usage(`kind must be one of ${ITEM_KINDS.join(', ')}`)
    if (!isOneOf(SIZES, input.size ?? 'M')) throw usage('size must be S, M or L')
    if (input.id && items.find(input.id)) throw refused(`item ${input.id} exists`, `kit eng item show ${input.id}`)
    for (const name of input.areas ?? []) this.home.areaNamed(name)
    const state = input.state ?? 'backlog'
    const id = this.ledger.write(() => {
      const id = input.id ?? items.nextId()
      const row = {
        id,
        title: input.title,
        kind: input.kind ?? 'feature',
        size: input.size ?? 'M',
        state,
        areas: input.areas ?? [],
        source: input.source ?? null,
      }
      items.insert({ ...row, quick: input.quick === true })
      events.record(id, 'new', { to: state })
      return id
    })
    if (input.backlog) this.writeTicket(id, input.title)
    return this.item(id)
  }

  private writeTicket(id: string, title: string): void {
    const ticket = join(this.home.backlogDir(id), 'ticket.md')
    if (existsSync(ticket)) return
    mkdirSync(join(dirname(ticket), 'attachments'), { recursive: true })
    writeFileSync(ticket, TICKET(id, title))
  }

  editItem(id: string, field: string, value: string, ifVersion?: string): Item {
    this.permissions.assert('item edit')
    const item = this.item(id)
    assertVersion(id, item.version, ifVersion)
    if (!isOneOf(EDIT_FIELDS, field)) throw usage(`the field must be one of ${EDIT_FIELDS.join(', ')}`)
    // kind, size and areas come from the approved spec: a change after the approve needs a replan first
    if (['kind', 'size', 'areas'].includes(field) && isFrozen(item.state))
      throw refused(
        `${id} is ${item.state}: ${field} is frozen after the approve`,
        `kit eng item replan ${id}`,
      )
    const stored = this.editValue(field, value)
    this.ledger.write(() => {
      this.stores.items.update(id, { [field]: stored })
      this.stores.events.record(id, 'edit', { reason: `${field} = ${value}` })
    })
    return this.item(id)
  }

  private editValue(field: EditField, value: string): Param {
    return match(field)
      .with('title', 'source', () => value)
      .with('kind', () => {
        if (!isOneOf(ITEM_KINDS, value)) throw usage(`kind must be one of ${ITEM_KINDS.join(', ')}`)
        return value
      })
      .with('size', () => {
        if (!isOneOf(SIZES, value.toUpperCase())) throw usage('size must be S, M or L')
        return value.toUpperCase()
      })
      .with('rank', () => {
        if (!/^-?\d+$/.test(value)) throw usage('rank must be a whole number')
        return Number(value)
      })
      .with('areas', () => {
        const names = value
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        for (const name of names) this.home.areaNamed(name)
        return JSON.stringify(names)
      })
      .exhaustive()
  }

  setMode(id: string, mode: string): Item {
    this.permissions.assert('mode')
    if (!isOneOf(MODES, mode)) throw usage('mode must be auto or normal')
    const item = this.item(id)
    this.ledger.write(() => {
      this.stores.items.update(id, { mode, mode_by: this.who.role })
      this.stores.events.record(id, 'mode', { from: item.mode, to: mode })
    })
    return this.item(id)
  }

  /** Moves the ticket folder to `backlog/archive/<id>/`; null when the item has none, as a quick fix with no ticket. */
  archive(id: string): string | null {
    this.permissions.assert('item archive')
    this.item(id)
    const from = this.home.backlogDir(id)
    if (!existsSync(from)) return null
    const to = join(dirname(from), 'archive', id)
    if (existsSync(to)) throw refused(`${to} exists`, 'remove or rename the old archive folder first')
    mkdirSync(dirname(to), { recursive: true })
    renameSync(from, to)
    this.ledger.write(() => this.stores.events.record(id, 'archive'))
    return to
  }

  addNote(id: string, text: string): void {
    this.permissions.assert('note add')
    this.item(id)
    this.ledger.write(() => {
      this.stores.notes.add(id, text, this.who.actor)
      this.stores.events.record(id, 'note', { reason: text.slice(0, 200) })
    })
  }

  /** `pickup`: the session of the caller leads the item. */
  takeItem(id: string): Item {
    this.permissions.assert('pickup')
    const item = this.item(id)
    this.ledger.write(() => this.stores.sessions.record(id))
    return item
  }

  moveItem(name: string, id: string, input: MoveInput = {}): MoveResult {
    const moveName = moveNamed(name)
    const move = MOVES[moveName]
    this.permissions.assert(move.action)
    const reason = input.reason?.trim() ?? null
    const { item, warnings, notes } = this.ledger.write(() => {
      const item = this.item(id)
      assertVersion(id, item.version, input.ifVersion)
      if (!move.from.includes(item.state))
        throw refused(`${id} is ${item.state}: ${name} needs ${move.from.join(' or ')}`, `kit eng next ${id}`)
      if (move.reason && !reason) throw usage(`${name} needs --reason "<why>"`)
      const found = this.gaps(item, moveName)
      if (found.length) throw refused(gapsHeading(name, id, found), found[0]!.fix)
      const warnings = this.moveWarnings(moveName, item)
      const notes = this.applyMove(moveName, item, reason)
      // a document that cannot be written fails the move, so no item sits in a stage without its document
      for (const doc of move.scaffolds ?? [])
        notes.push(...this.templates.scaffold(this.folder(id), this.item(id), doc))
      return { item, warnings, notes }
    })
    return { item: this.item(id), warnings, notes }
  }

  /** The writes of a move that passed its guards; returns the notes for the caller. */
  private applyMove(name: MoveName, item: Item, reason: string | null): string[] {
    const move = MOVES[name]
    const { state, blocked_from } = afterMove(name, item)
    const fields: Record<string, Param> = { state, reason, blocked_from }
    const notes: string[] = []
    if (move.copiesSpec) Object.assign(fields, this.copySpec(item.id, notes))
    if (move.approves)
      for (const doc of APPROVED_DOCS)
        this.stores.approvals.store(item.id, doc, this.folder(item.id).hash(doc))
    if (move.back) {
      this.stores.approvals.clear(item.id)
      fields.evidence_from = this.stores.checks.lastId()
    }
    this.stores.items.update(item.id, fields)
    this.stores.events.record(item.id, name, { from: item.state, to: state, reason })
    if (this.who.role === 'lead') this.stores.sessions.record(item.id)
    return notes
  }

  /** spec.md is the source of kind, size, areas and the criteria. */
  private copySpec(id: string, notes: string[]): Record<string, string> {
    const text = this.folder(id).read('spec.md')
    if (text === null) return {}
    const spec = SpecDocument.parse(text)
    const cleared = this.stores.criteria.sync(
      id,
      spec.criteria.map(c => c.text),
    )
    for (const n of cleared)
      this.stores.events.record(id, 'ac', { reason: `AC ${n}: the mark was cleared, its text changed` })
    if (cleared.length) notes.push(`marks cleared, the text changed: AC ${cleared.join(', AC ')}`)
    const fields: Record<string, string> = { areas: JSON.stringify(spec.areas) }
    if (spec.kind) fields.kind = spec.kind
    if (spec.size) fields.size = spec.size
    return fields
  }

  /** What a move that passed its guards still tells the lead: done slices with no proof at submit, criteria over the proposed cap at agree. */
  private moveWarnings(name: MoveName, item: Item): string[] {
    if (name === 'submit') return this.proofWarnings(item.id)
    if (name === 'agree') return this.criteriaWarnings(item)
    return []
  }

  /** The cap is a proposal: a complex requirement can hold more criteria, with a reason in the Decisions table. */
  private criteriaWarnings(item: Item): string[] {
    const text = this.folder(item.id).read('spec.md')
    if (text === null) return []
    const spec = SpecDocument.parse(text)
    const size = isOneOf(SIZES, spec.size) ? spec.size : item.size
    const ticketFile = join(this.home.backlogDir(item.id), 'ticket.md')
    const ticket = existsSync(ticketFile) ? readFileSync(ticketFile, 'utf8') : null
    const { cap, why } = criteriaCap(size, ticketCriteria(ticket))
    if (spec.criteria.length <= cap) return []
    return [
      `spec.md has ${spec.criteria.length} acceptance criteria; the proposed cap is ${cap}: ${why}. Merge them, or keep them for a complex requirement and say why in the Decisions table.`,
    ]
  }

  /** Done slices with no proof: a warning at submit, not a gap. */
  private proofWarnings(id: string): string[] {
    return this.stores.slices
      .live(id)
      .filter(s => s.state === 'done' && (s.proof === 'none' || s.proof === 'weak'))
      .map(s => `${s.id} is done with proof ${s.proof}${s.proof_note ? ` (${s.proof_note})` : ''}`)
  }

  /** `quick`: an item in cooking with one running slice for the caller, with no spec and no plan. */
  quick(idOrTitle: string, areaName: string): Item {
    this.permissions.assert('quick')
    const named = ID_PATTERN.test(idOrTitle) ? idOrTitle : undefined
    const area = this.home.areaNamed(areaName)
    const other = this.stores.items.cookingIn(area.name)
    if (other)
      throw refused(
        `area ${area.name} is in use by ${other.id}`,
        `wait for ${other.id}, or pick another area`,
      )
    return this.ledger.write(() => {
      const { id } = this.newItem({
        id: named,
        title: idOrTitle,
        kind: 'fix',
        size: 'S',
        areas: [area.name],
        quick: true,
        state: 'cooking',
      })
      this.stores.slices.insertRunning(id, idOrTitle, area.name, this.who.actor)
      this.stores.events.record(id, 'quick', { to: 'cooking', reason: `T1 running in ${area.name}` })
      if (this.who.role === 'lead') this.stores.sessions.record(id)
      return this.item(id)
    })
  }

  addCriterion(id: string, text: string, tag = 'ADD'): Criterion {
    this.permissions.assert('item ac add')
    const item = this.item(id)
    if (!isOneOf(TAGS, tag)) throw usage(`the tag must be one of ${TAGS.join(', ')}`)
    if (isFrozen(item.state) && !item.quick)
      throw refused(
        `${id} is ${item.state}: the criteria are frozen after the approve`,
        `kit eng item replan ${id}`,
      )
    const line = `[${tag}] ${text.trim()}`
    const n = this.stores.criteria.list(id).length + 1
    this.ledger.write(() => {
      this.stores.criteria.add(id, n, line)
      this.stores.events.record(id, 'ac', { reason: `AC ${n} added: ${line}` })
    })
    this.appendToSpec(id, line)
    return this.stores.criteria.find(id, n)!
  }

  /** The spec stays the source: a new criterion goes under its heading when the file exists. */
  private appendToSpec(id: string, line: string): void {
    const folder = this.folder(id)
    const text = folder.read('spec.md')
    const changed = text === null ? null : SpecDocument.withCriterion(text, line)
    if (changed !== null) writeFileSync(folder.path('spec.md'), changed)
  }

  markCriterion(id: string, n: number, evidence: string, grade: string): Criterion {
    this.permissions.assert('item ac done')
    this.item(id)
    if (!isOneOf(GRADES, grade)) throw usage(`the grade must be one of ${GRADES.join(', ')}`)
    if (!evidence.trim()) throw usage('give the evidence: what shows that the criterion is met')
    this.criterion(id, n)
    this.ledger.write(() => {
      this.stores.criteria.mark(id, n, evidence.trim(), grade, this.who.actor)
      this.stores.events.record(id, 'ac', {
        reason: `AC ${n} done (${grade}): ${evidence.trim().slice(0, 200)}`,
      })
    })
    return this.criterion(id, n)
  }

  unmarkCriterion(id: string, n: number): Criterion {
    this.permissions.assert('item ac done')
    this.item(id)
    this.criterion(id, n)
    this.ledger.write(() => {
      this.stores.criteria.unmark(id, n)
      this.stores.events.record(id, 'ac', { reason: `AC ${n} undone` })
    })
    return this.criterion(id, n)
  }

  private criterion(id: string, n: number): Criterion {
    const found = this.stores.criteria.find(id, n)
    if (!found) throw usage(`${id} has no AC ${n}`, `kit eng item ac list ${id}`)
    return found
  }

  /** tasks.md into the ledger by slice id: new slices are made, todo slices follow the file, others stay. */
  importTasks(id: string): ImportReport {
    this.permissions.assert('task import')
    const item = this.item(id)
    if (isFrozen(item.state))
      throw refused(
        `${id} is ${item.state}: the slices are frozen after the approve`,
        `replan first: kit eng item replan ${id}`,
      )
    const file = this.folder(id).path('tasks.md')
    const text = this.folder(id).read('tasks.md')
    if (text === null) throw refused(`${file} is missing`, `kit eng item agree ${id} scaffolds it`)
    const tasks = TasksDocument.parse(text)
    if (tasks.problems.length)
      throw refused(
        `tasks.md has gaps:\n${tasks.problems.map(p => `  - ${p}`).join('\n')}`,
        `fix the lines in ${file}`,
      )
    return this.ledger.write(() => {
      const report = this.importSlices(id, tasks)
      this.stores.events.record(id, 'import', {
        reason: `slices: +${report.created.length} ~${report.updated.length} -${report.cancelled.length}`,
      })
      return report
    })
  }

  private importSlices(id: string, tasks: TasksDocument): ImportReport {
    const slices = this.stores.slices
    const report: ImportReport = { created: [], updated: [], cancelled: [], kept: [] }
    const have = new Map(slices.list(id).map(s => [s.id, s]))
    for (const spec of tasks.slices) {
      const old = have.get(spec.id)
      if (!old) {
        slices.insert(id, spec)
        report.created.push(spec.id)
      } else if (old.state === 'cancelled' || (old.state === 'todo' && !sameAsSpec(old, spec))) {
        slices.replace(id, spec)
        report.updated.push(spec.id)
      } else if (old.state !== 'todo') report.kept.push(`${spec.id} (${old.state})`)
    }
    const inFile = new Set(tasks.slices.map(s => s.id))
    for (const old of have.values()) {
      if (inFile.has(old.id) || old.state === 'cancelled') continue
      if (old.state !== 'todo') {
        report.kept.push(`${old.id} (${old.state}, not in tasks.md)`)
        continue
      }
      slices.cancel(id, old.id, 'removed from tasks.md')
      report.cancelled.push(old.id)
    }
    return report
  }

  moveSlice(name: string, id: string, sliceId: string, input: SliceMoveInput = {}): Slice {
    const moveName = sliceMoveNamed(name)
    const move = SLICE_MOVES[moveName]
    this.permissions.assert(move.action)
    const item = this.item(id)
    const slice = this.stores.slices.get(id, sliceId)
    assertVersion(`${id} ${slice.id}`, slice.version, input.ifVersion)
    // a todo slice has no owner yet, so start takes it
    if (move.own && slice.state !== 'todo') this.permissions.assertOwnSlice(slice.assignee, slice.id)
    if (!move.from.includes(slice.state))
      throw refused(
        `${slice.id} is ${slice.state}: ${name} needs ${move.from.join(' or ')}`,
        `kit eng task show ${id} ${slice.id}`,
      )
    if (move.reason && !input.reason?.trim()) throw usage(`${name} needs --reason`)
    if (move.to === 'running') this.assertCanRun(item, slice)
    const files = input.files?.length ? [...new Set([...slice.files, ...input.files])] : slice.files
    this.ledger.write(() => {
      const assignee = assigneeAfter(moveName, slice.assignee, this.who.actor)
      this.stores.slices.change(id, slice.id, {
        state: move.to,
        assignee,
        reason: input.reason?.trim() ?? null,
        files,
      })
      this.stores.events.record(id, 'task', {
        from: slice.state,
        to: move.to,
        reason: `${slice.id} ${name}${input.reason ? `: ${input.reason}` : ''}`,
      })
    })
    return this.stores.slices.get(id, slice.id)
  }

  /** A slice runs only when the item is in cooking and every slice in `depends` is done. */
  private assertCanRun(item: Item, slice: Slice): void {
    if (item.state !== 'cooking')
      throw refused(`${item.id} is ${item.state}: a slice starts only in cooking`, `kit eng next ${item.id}`)
    const done = this.stores.slices.doneIds(item.id)
    const waiting = slice.depends.filter(d => !done.has(d))
    if (waiting.length)
      throw refused(
        `${slice.id} depends on ${waiting.join(', ')}, not done yet`,
        `kit eng task list ${item.id} --ready`,
      )
  }

  ask(id: string, text: string, blocking: boolean, recommended?: string): Question {
    this.permissions.assert('ask')
    this.item(id)
    if (!text.trim()) throw usage('give the question')
    const questions = this.stores.questions
    const qid = questions.nextId(id)
    this.ledger.write(() => {
      questions.insert({
        id: qid,
        item: id,
        text: text.trim(),
        blocking,
        recommended: recommended ?? null,
        by: this.who.actor,
      })
      this.stores.events.record(id, 'question', {
        reason: `${qid} asked${blocking ? ' (blocking)' : ''}: ${text.trim().slice(0, 200)}`,
      })
    })
    return questions.find(id, qid)!
  }

  answer(id: string, qid: string, text: string): Question {
    this.permissions.assert('answer')
    this.item(id)
    const questions = this.stores.questions
    const question = questions.find(id, qid.toUpperCase())
    if (!question) throw usage(`${id} has no question ${qid}`, `kit eng questions ${id}`)
    if (question.status === 'answered')
      throw refused(`${qid} is answered: ${question.answer}`, 'ask a new question when the answer changed')
    if (!text.trim()) throw usage('give the answer')
    this.ledger.write(() => {
      questions.answer(id, question.id, text.trim(), this.who.actor)
      this.stores.events.record(id, 'question', {
        reason: `${question.id} answered: ${text.trim().slice(0, 200)}`,
      })
    })
    return questions.find(id, question.id)!
  }

  addGuess(id: string, input: NewGuessInput): Guess {
    this.permissions.assert('guess')
    this.item(id)
    if (!isOneOf(IMPACTS, input.impact)) throw usage('impact must be low, med or high')
    const [question, took, other] = [input.question.trim(), input.took.trim(), input.other.trim()]
    if (!question || !took || !other)
      throw usage('give the question, what you took (--took) and the other option (--other)')
    const known = this.stores.slices.ids(id)
    for (const slice of input.slices)
      if (!known.has(slice)) throw usage(`${id} has no slice ${slice}`, `kit eng task list ${id}`)
    const guesses = this.stores.guesses
    const gid = guesses.nextId(id)
    this.ledger.write(() => {
      guesses.insert({
        id: gid,
        item: id,
        question,
        took,
        other,
        impact: input.impact as Guess['impact'],
        slices: input.slices,
        by: this.who.actor,
      })
      this.stores.events.record(id, 'guess', {
        reason: `${gid} (${input.impact}): took "${took}" over "${other}"`,
      })
    })
    return guesses.find(id, gid)!
  }

  /** accept keeps the work; flip sends the slices of the guess back to todo and leaves the others. */
  /** The slices that an open guess shapes, named after the slicing; a flip resets them. */
  setGuessSlices(id: string, gid: string, slices: string[]): Guess {
    this.permissions.assert('guess')
    this.item(id)
    const guess = this.stores.guesses.find(id, gid.toUpperCase())
    if (!guess) throw usage(`${id} has no guess ${gid}`, `kit eng guesses ${id}`)
    if (guess.status !== 'open') throw refused(`${guess.id} is ${guess.status}`, 'only an open guess changes its slices')
    const known = this.stores.slices.ids(id)
    for (const slice of slices)
      if (!known.has(slice)) throw usage(`${id} has no slice ${slice}`, `kit eng task list ${id}`)
    this.ledger.write(() => {
      this.stores.guesses.setSlices(id, guess.id, slices)
      this.stores.events.record(id, 'guess', { reason: `${guess.id} shapes ${slices.join(', ') || 'no slice'}` })
    })
    return this.stores.guesses.find(id, guess.id)!
  }

  decideGuess(
    id: string,
    gid: string,
    decision: 'accept' | 'flip',
    answer?: string,
  ): Guess & { reset: string[] } {
    const [action, status] = match(decision)
      .with('accept', () => ['guess accept', 'accepted'] as const)
      .with('flip', () => ['guess flip', 'flipped'] as const)
      .exhaustive()
    this.permissions.assert(action)
    // a done item is accepted work: a flip records what the code took, and sends no slice back
    const rework = this.item(id).state !== 'done'
    const guess = this.stores.guesses.find(id, gid.toUpperCase())
    if (!guess) throw usage(`${id} has no guess ${gid}`, `kit eng guesses ${id}`)
    if (guess.status !== 'open')
      throw refused(`${guess.id} is ${guess.status}`, 'record a new guess when the answer changed again')
    const reset = this.ledger.write(() => {
      this.stores.guesses.decide(id, guess.id, status, answer ?? null)
      const reset = decision === 'flip' && rework ? this.resetSlices(id, guess) : []
      const back = reset.length ? `; back to todo: ${reset.join(', ')}` : ''
      this.stores.events.record(id, 'guess', {
        reason: `${guess.id} ${status}${back}${answer ? `; answer: ${answer}` : ''}`,
      })
      return reset
    })
    return { ...this.stores.guesses.find(id, guess.id)!, reset }
  }

  private resetSlices(id: string, guess: Guess): string[] {
    const live = guess.slices.filter(s => {
      const slice = this.stores.slices.find(id, s)
      return slice !== null && slice.state !== 'cancelled'
    })
    for (const slice of live) this.stores.slices.resetToTodo(id, slice, `${guess.id} flipped`)
    return live
  }

  /** `item verify`: the checks of each area run first, with no lock held; one short write records them. */
  verify(id: string, only?: string): CheckRun[] {
    this.permissions.assert('item verify')
    const item = this.item(id)
    const config = this.home.config
    if (config.missing || !config.areas.length)
      throw refused('kit.yml has no areas, so there is nothing to check', 'add areas to kit.yml with /setup')
    const names = only ? [only] : item.areas
    if (!names.length) throw refused(`${id} has no areas`, `kit eng item edit ${id} areas <a,b>`)
    const areas = names.map(name => this.home.areaNamed(name))
    for (const area of areas) {
      if (!area.checks)
        throw refused(
          `area ${area.name} has no \`checks\` in kit.yml`,
          'add checks: [<command>] to the area, or checks: [] for none',
        )
      const dir = this.home.areaDir(area)
      if (!existsSync(dir))
        throw refused(`the folder of area ${area.name} does not exist: ${dir}`, 'fix the path in kit.yml')
    }
    const at = now()
    const outcomes = areas.flatMap(area =>
      (area.checks ?? []).map(check => this.runCheck(area.name, this.home.areaDir(area), check)),
    )
    this.ledger.write(() => {
      this.stores.checks.insert(id, outcomes, at)
      this.stores.events.record(id, 'verify', {
        reason: `${outcomes.filter(r => r.result === 'pass').length}/${outcomes.length} checks passed`,
      })
    })
    return this.stores.checks.lastRun(item)
  }

  private runCheck(area: string, dir: string, check: string): CheckOutcome {
    const run = runShell(check, dir, CHECK_LIMIT_MS)
    return { area, check, result: run.code === 0 ? 'pass' : 'fail', output: run.output.slice(-OUTPUT_KEEP) }
  }

  lastRun(id: string): CheckRun[] {
    return this.stores.checks.lastRun(this.item(id))
  }

  /** `item branch`: `kit/<id>-<slug>` in each git area, switched to. */
  branch(id: string): BranchResult[] {
    this.permissions.assert('item branch')
    const item = this.item(id)
    const branching = new Branching(this.home)
    const areas = branching.gitAreas(item.areas)
    if (!areas.length)
      throw refused(`${id} has no git area`, `kit eng item edit ${id} areas <a,b>, with git: true in kit.yml`)
    const branch = branchName(item)
    if (this.home.config.isProtected(branch))
      throw refused(`${branch} is a protected branch`, 'change the title, or the protected list of kit.yml')
    for (const area of areas) {
      const other = this.stores.items.cookingIn(area.name, id)
      if (other)
        throw refused(
          `area ${area.name} is in use by ${other.id}`,
          `wait for ${other.id}, or move ${id} to another area`,
        )
    }
    const results = branching.switchAll(areas, branch)
    this.ledger.write(() =>
      this.stores.events.record(id, 'branch', {
        reason: `${branch} in ${results.map(r => r.area).join(', ')}`,
      }),
    )
    return results
  }

  commitPlan(id: string): CommitPlan {
    this.permissions.assert('item commit')
    const item = this.item(id)
    if (!['cooking', 'checking', 'done'].includes(item.state))
      throw refused(
        `${id} is ${item.state}: commits come from cooking, checking or done`,
        `kit eng next ${id}`,
      )
    return planCommits(
      this.home,
      id,
      this.stores.slices.live(id).filter(s => s.state === 'done'),
    )
  }

  commit(id: string): CommitPlan {
    const plan = this.commitPlan(id)
    runCommits(plan, this.home.config, id)
    const made = plan.entries.map(e => `${e.slice} ${e.commit}`).join(', ') || 'nothing to commit'
    this.ledger.write(() => this.stores.events.record(id, 'commit', { reason: made }))
    return plan
  }

  prove(id: string, sliceId: string, files: string[]): Proved {
    this.permissions.assert('task prove')
    const item = this.item(id)
    const slice = this.stores.slices.get(id, sliceId)
    if (!['cooking', 'checking'].includes(item.state))
      throw refused(`${id} is ${item.state}: a slice is proven in cooking or checking`, `kit eng next ${id}`)
    const area = this.home.areaNamed(slice.area)
    const list = files.length ? files : slice.files
    if (!list.length)
      throw usage(`${slice.id} has no files yet`, `kit eng task prove ${id} ${slice.id} --files <f...>`)
    if (slice.proof === 'skipped')
      return this.storeProof(
        id,
        slice.id,
        { proof: 'skipped', note: slice.proof_note ?? 'tasks.md marks the slice as proof: none' },
        [],
      )
    const tests = list.map(f => this.home.fileInArea(area, f)).filter(isTestFile)
    if (!tests.length)
      return this.storeProof(id, slice.id, { proof: 'none', note: 'the slice has no test file' }, [])
    if (!area.test)
      throw refused(
        `area ${area.name} has no \`test\` command in kit.yml`,
        'add test: "<command> {files}" to the area',
      )
    if (!area.git || !new GitRepo(this.home.areaDir(area)).isRepo()) {
      throw refused(
        `area ${area.name} is not a git repo, so there is no base to prove on`,
        'set git: true and make the folder a repo',
      )
    }
    const result = new Prover(this.home, area).prove(`${id}-${slice.id}`, tests, area.test)
    return this.storeProof(id, slice.id, result, tests)
  }

  private storeProof(id: string, sliceId: string, result: ProofResult, tests: string[]): Proved {
    this.ledger.write(() => {
      this.stores.slices.recordProof(id, sliceId, result.proof, result.note)
      this.stores.events.record(id, 'prove', {
        reason: `${sliceId} ${result.proof}: ${result.note.slice(0, 200)}`,
      })
    })
    return { slice: sliceId, proof: result.proof, note: result.note, tests }
  }

  newAdr(title: string, item?: string): Adr {
    this.permissions.assert('adr')
    if (!title.trim()) throw usage('give the title')
    return this.stores.adrs.create(title, item)
  }

  setAdrStatus(n: number, status: Exclude<AdrStatus, 'proposed'>, by?: number): Adr {
    this.permissions.assert('adr')
    const adrs = this.stores.adrs
    const adr = adrs.find(n)
    if (!adr) throw new EvError(`no ADR ${n}`, Exit.error, 'kit eng adr list')
    if (status === 'superseded' && (!by || !adrs.find(by)))
      throw usage('--by must name an ADR that exists', 'kit eng adr list')
    return adrs.setStatus(adr, status, by)
  }
}
