import { Branching } from '../git/branching.ts'
import { type FileChange, GitRepo } from '../git/repo.ts'
import { Home } from '../home.ts'
import { Ledger } from '../ledger.ts'
import { MOVE_NAMES, type MoveName, type State } from '../machine.ts'
import { isArchived, type Next, nextFor } from '../report/next.ts'
import { flowOf } from '../flows.ts'
import { Engineering } from '../service.ts'
import type { CheckRun } from '../stores/checks.ts'
import type { Event } from '../stores/events.ts'
import type { Criterion } from '../stores/criteria.ts'
import type { Guess } from '../stores/guesses.ts'
import type { Item } from '../stores/items.ts'
import type { TypeKind } from '../stores/type-kinds.ts'
import type { Question } from '../stores/questions.ts'
import type { Slice } from '../stores/slices.ts'
import { Who } from '../who.ts'
import { type EventLine, eventLine } from './event-lines.ts'
import { deskHistories, deskMetrics, type Metrics, METRICS_SPAN_MS, metricsOf } from '../report/metrics.ts'

/**
 * The read paths of engineering for the web app: plain functions on a desk folder. Each one opens the ledger
 * read-only as a reader, so it never migrates, never writes a row, and runs under Bun or Node.
 */

/** One card of the board: the item, its criteria met and slices done, whose move is next, and what holds it up. */
export type BoardCard = Pick<Item, 'id' | 'title' | 'kind' | 'size' | 'points' | 'mode' | 'state' | 'blocked_from' | 'areas'> & {
  criteria: { met: number; total: number }
  slices: { done: number; total: number }
  next: Pick<Next, 'owner' | 'skill'>
  flags: string[]
}
/** One change of state of an item: the move, the state it went to, and when. */
export type ItemMove = { move: MoveName | 'new'; to: State; at: string }
export type AreaChange = { area: string; branch: string; files: FileChange[] }
export type ItemView = {
  item: Item
  next: Next
  needs: { questions: Question[]; guesses: Guess[] }
  criteria: Criterion[]
  slices: Slice[]
  questions: Question[]
  guesses: Guess[]
  moves: ItemMove[]
  events: EventLine[]
  checks: CheckRun[]
  changes: AreaChange[]
}
const DOC_FILES = { spec: 'spec.md', 'root-cause': 'root-cause.md', plan: 'plan.md', tasks: 'tasks.md', walkthrough: 'walkthrough.md', findings: 'findings.md' } as const
export type DocName = keyof typeof DOC_FILES
/** The documents of an item in the order that its flow writes them, each with its text, or null when not written yet. */
export type ItemDocs = { name: DocName; text: string | null }[]

const READER = new Who('reader', 'web', null)

function withReader<T>(desk: string, read: (eng: Engineering) => T): T {
  const home = Home.require(desk)
  const eng = new Engineering(home, Ledger.openReadOnly(home.dbFile), READER)
  try {
    return read(eng)
  } finally {
    eng.ledger.close()
  }
}

/** What the settings page shows of the engineering home: the areas, the kinds that the desk learned, the root cause types. */
export type EngineeringSettings = { areas: { name: string; path: string; kind: string; checks: string[] }[]; kinds: TypeKind[]; rootCauses: string[]; unknownRootCause: string | null }

export function readSettings(desk: string): EngineeringSettings | null {
  const home = Home.find(desk)
  if (!home) return null
  const { config } = home
  return withReader(desk, eng => ({
    areas: config.areas.map(area => ({ name: area.name, path: area.path, kind: area.kind, checks: area.checks ?? [] })),
    kinds: eng.stores.typeKinds.list(),
    rootCauses: config.rootCauses,
    unknownRootCause: config.unknownRootCause ?? null,
  }))
}

/** The metrics of the last 30 days; null when the desk has no engineering home. */
export function readMetrics(desk: string, now = new Date()): Metrics | null {
  return Home.find(desk) ? withReader(desk, eng => deskMetrics(eng, new Date(now.getTime() - METRICS_SPAN_MS), now)) : null
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** The metrics of each of the last `weeks` weeks up to now, the oldest first, for a trend line; null for a desk with no engineering home. */
export function readTrend(desk: string, now = new Date(), weeks = 6): Metrics[] | null {
  if (!Home.find(desk)) return null
  return withReader(desk, eng => {
    const histories = deskHistories(eng)
    return Array.from({ length: weeks }, (_, i) => {
      const until = new Date(now.getTime() - (weeks - 1 - i) * WEEK_MS)
      return metricsOf(histories, new Date(until.getTime() - WEEK_MS), until)
    })
  })
}

/** One event of an item as a line for a person, with the item it belongs to. */
export type Receipt = EventLine & { item: string }

/** The events of every item of the desk since a time, the newest first, such as the receipts of today. */
export function readReceipts(desk: string, since: Date): Receipt[] {
  return withReader(desk, eng => eng.stores.events.since(since.toISOString()).map(event => ({ ...eventLine(event), item: event.item })))
}

/** The areas of the engineering home of the desk, in the order of `nook.yml`; none when the desk has no home. */
export function readAreas(desk: string): string[] {
  return Home.find(desk)?.config.areas.map(area => area.name) ?? []
}

/** The open items and the done ones not yet archived, as `nook eng next` lists them. */
export function readBoard(desk: string): BoardCard[] {
  return withReader(desk, eng => {
    const items = [...eng.stores.items.open(), ...eng.stores.items.list('done').filter(i => !isArchived(eng, i.id))]
    return items.map(item => {
      const { id, title, kind, size, points, mode, state, blocked_from, areas } = item
      const criteria = eng.stores.criteria.list(id)
      const slices = eng.stores.slices.live(id)
      const { owner, skill } = nextFor(eng, item)
      const flags = [...eng.stores.questions.openBlocking(id).map(q => `${q.id} blocks`), ...slices.filter(s => s.state === 'failed').map(s => `${s.id} failed`)]
      return {
        id, title, kind, size, points, mode, state, blocked_from, areas,
        criteria: { met: criteria.filter(c => c.done).length, total: criteria.length },
        slices: { done: slices.filter(s => s.state === 'done').length, total: slices.length },
        next: { owner, skill },
        flags,
      }
    })
  })
}

export function readItem(desk: string, id: string): ItemView {
  return withReader(desk, eng => {
    const item = eng.item(id)
    const questions = eng.stores.questions.list(id)
    const guesses = eng.stores.guesses.list(id)
    const open = questions.filter(q => q.status === 'open')
    const history = eng.stores.events.history(id)
    return {
      item,
      next: nextFor(eng, item),
      needs: { questions: [...open.filter(q => q.blocking), ...open.filter(q => !q.blocking)], guesses: guesses.filter(g => g.status === 'open') },
      criteria: eng.stores.criteria.list(id),
      slices: eng.stores.slices.list(id),
      questions,
      guesses,
      moves: movesOf(history),
      events: history.map(eventLine),
      checks: eng.stores.checks.lastRun(item),
      changes: changesOf(eng, item),
    }
  })
}

const isMove = (type: string): type is ItemMove['move'] => type === 'new' || (MOVE_NAMES as readonly string[]).includes(type)

function movesOf(history: Event[]): ItemMove[] {
  return history.flatMap(e => (isMove(e.type) && e.to_state ? [{ move: e.type, to: e.to_state as State, at: e.at }] : []))
}

const BUILDING: State[] = ['cooking', 'review']

/**
 * The files that each git area of the item changed on its branch. An item holds the branch of an area from its begin
 * to its accept, while no other item cooks in the area; before that, the branch of the area is the work of another item.
 */
function changesOf(eng: Engineering, item: Item): AreaChange[] {
  const config = eng.home.config
  const step = item.state === 'blocked' ? item.blocked_from : item.state
  if (!step || !BUILDING.includes(step)) return []
  const held = new Branching(eng.home).gitAreas(item.areas).filter(area => !eng.stores.items.cookingIn(area.name, item.id))
  return held.flatMap(area => {
    const repo = new GitRepo(eng.home.areaDir(area))
    const branch = repo.branch()
    const base = repo.mainBase(config.protected)
    if (!branch || config.isProtected(branch) || !base) return []
    return [{ area: area.name, branch, files: repo.changedFiles(base) }]
  })
}

/** The documents that the flow of a kind asks for: a fix adds its root cause, and an investigation its findings with no slices. */
function docNames(kind: Item['kind']): DocName[] {
  const flow = flowOf(kind)
  return [
    'spec',
    ...(flow.submit.includes('root-cause') ? (['root-cause'] as const) : []),
    'plan',
    ...(flow.slices === 'required' ? (['tasks', 'walkthrough'] as const) : []),
    ...(flow.submit.includes('findings') ? (['findings'] as const) : []),
  ]
}

export function readDocs(desk: string, id: string): ItemDocs {
  return withReader(desk, eng => {
    const item = eng.item(id)
    const folder = eng.folder(item.id)
    return docNames(item.kind).map(name => ({ name, text: folder.read(DOC_FILES[name]) }))
  })
}
