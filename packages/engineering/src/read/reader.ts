import { Branching } from '../git/branching.ts'
import { type FileChange, GitRepo } from '../git/repo.ts'
import { Home } from '../home.ts'
import { Ledger } from '../ledger.ts'
import { isArchived, type Next, nextFor } from '../report/next.ts'
import { Engineering } from '../service.ts'
import type { CheckRun } from '../stores/checks.ts'
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

export type BoardCard = Pick<Item, 'id' | 'title' | 'kind' | 'size' | 'state' | 'areas'> & { criteria: { met: number; total: number } }
export type AreaChange = { area: string; branch: string; files: FileChange[] }
export type ItemView = {
  item: Item
  next: Next
  needs: { questions: Question[]; guesses: Guess[] }
  criteria: Criterion[]
  slices: Slice[]
  questions: Question[]
  guesses: Guess[]
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

/** The open items and the done ones not yet archived, as `nook eng next` lists them. */
export function readBoard(desk: string): BoardCard[] {
  return withReader(desk, eng => {
    const items = [...eng.stores.items.open(), ...eng.stores.items.list('done').filter(i => !isArchived(eng, i.id))]
    return items.map(({ id, title, kind, size, state, areas }) => {
      const criteria = eng.stores.criteria.list(id)
      return { id, title, kind, size, state, areas, criteria: { met: criteria.filter(c => c.done).length, total: criteria.length } }
    })
  })
}

export function readItem(desk: string, id: string): ItemView {
  return withReader(desk, eng => {
    const item = eng.item(id)
    const questions = eng.stores.questions.list(id)
    const guesses = eng.stores.guesses.list(id)
    const open = questions.filter(q => q.status === 'open')
    return {
      item,
      next: nextFor(eng, item),
      needs: { questions: [...open.filter(q => q.blocking), ...open.filter(q => !q.blocking)], guesses: guesses.filter(g => g.status === 'open') },
      criteria: eng.stores.criteria.list(id),
      slices: eng.stores.slices.list(id),
      questions,
      guesses,
      events: eng.stores.events.history(id).map(eventLine),
      checks: eng.stores.checks.lastRun(item),
      changes: changesOf(eng, item),
    }
  })
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
