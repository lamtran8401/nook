import { Branching } from '../git/branching.ts'
import { type FileChange, GitRepo } from '../git/repo.ts'
import { Home } from '../home.ts'
import { Ledger } from '../ledger.ts'
import { MOVE_NAMES, type MoveName, type State } from '../machine.ts'
import { isArchived, type Next, nextFor } from '../report/next.ts'
import { Engineering } from '../service.ts'
import type { CheckRun } from '../stores/checks.ts'
import type { Event } from '../stores/events.ts'
import type { Criterion } from '../stores/criteria.ts'
import type { Guess } from '../stores/guesses.ts'
import type { Item } from '../stores/items.ts'
import type { Question } from '../stores/questions.ts'
import type { Slice } from '../stores/slices.ts'
import { Who } from '../who.ts'
import { type EventLine, eventLine } from './event-lines.ts'

/**
 * The read paths of engineering for the web app: plain functions on a desk folder. Each one opens the ledger
 * read-only as a reader, so it never migrates, never writes a row, and runs under Bun or Node.
 */

/** One card of the board: the item, its criteria met and slices done, whose move is next, and what holds it up. */
export type BoardCard = Pick<Item, 'id' | 'title' | 'kind' | 'size' | 'state' | 'areas'> & {
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
export type ItemDocs = { spec: string | null; plan: string | null; tasks: string | null; walkthrough: string | null }

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

/** The areas of the engineering home of the desk, in the order of `nook.yml`; none when the desk has no home. */
export function readAreas(desk: string): string[] {
  return Home.find(desk)?.config.areas.map(area => area.name) ?? []
}

/** The open items and the done ones not yet archived, as `nook eng next` lists them. */
export function readBoard(desk: string): BoardCard[] {
  return withReader(desk, eng => {
    const items = [...eng.stores.items.open(), ...eng.stores.items.list('done').filter(i => !isArchived(eng, i.id))]
    return items.map(item => {
      const { id, title, kind, size, state, areas } = item
      const criteria = eng.stores.criteria.list(id)
      const slices = eng.stores.slices.live(id)
      const { owner, skill } = nextFor(eng, item)
      const flags = [...eng.stores.questions.openBlocking(id).map(q => `${q.id} blocks`), ...slices.filter(s => s.state === 'failed').map(s => `${s.id} failed`)]
      return {
        id, title, kind, size, state, areas,
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

/** The files that each git area of the item changed on its branch; an area still on its main branch has none. */
function changesOf(eng: Engineering, item: Item): AreaChange[] {
  const config = eng.home.config
  return new Branching(eng.home).gitAreas(item.areas).flatMap(area => {
    const repo = new GitRepo(eng.home.areaDir(area))
    const branch = repo.branch()
    const base = repo.mainBase(config.protected)
    if (!branch || config.isProtected(branch) || !base) return []
    return [{ area: area.name, branch, files: repo.changedFiles(base) }]
  })
}

export function readDocs(desk: string, id: string): ItemDocs {
  return withReader(desk, eng => {
    const folder = eng.folder(eng.item(id).id)
    return { spec: folder.read('spec.md'), plan: folder.read('plan.md'), tasks: folder.read('tasks.md'), walkthrough: folder.read('walkthrough.md') }
  })
}
