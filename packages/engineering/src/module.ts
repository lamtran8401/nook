import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { join, relative } from 'node:path'

import type { GateResult, FeatureModule } from '@nook/workspace/workspaces.ts'
import { EvError } from '@nook/shared/errors.ts'

import { DEFAULTS, LEGACY_DIR } from './config.ts'
import { Home } from './home.ts'
import { Ledger } from './ledger.ts'
import { isOpen } from './machine.ts'
import { OWNER_STEP } from './owner-step.ts'
import { brief, doneSince, runs } from './report/brief.ts'
import { doctor, doctorWithoutLedger } from './report/doctor.ts'
import { retroFacts } from './report/retro.ts'
import { next } from './report/next.ts'
import { Engineering } from './service.ts'
import { Who } from './who.ts'

/** The engineering home in `dir`, only when `dir` itself has the section: a child does not set up its parent. */
const homeAt = (dir: string): Home | null => {
  const home = Home.find(dir)
  return home && home.dir === dir ? home : null
}

/** A home that keeps the default item folder gets its old work/ moved to works/, once. */
function moveLegacyWork(home: Home): string[] {
  const legacy = join(home.dir, LEGACY_DIR)
  if (home.config.dir !== DEFAULTS.dir || existsSync(home.workRoot) || !existsSync(legacy)) return []
  renameSync(legacy, home.workRoot)
  return [`${LEGACY_DIR}/ → ${DEFAULTS.dir}/`]
}

const GATES = ['approve', 'accept', 'mode'] as const

/** A read of engineering: the ledger opens read-only and closes after. A missing ledger, or one that needs a migration, gives `onGap`. */
function reading<T>(home: Home, read: (eng: Engineering) => T, onGap: (gap: EvError) => T): T {
  let ledger: Ledger
  try {
    ledger = Ledger.openReadOnly(home.dbFile)
  } catch (error) {
    if (error instanceof EvError) return onGap(error)
    throw error
  }
  try {
    return read(new Engineering(home, ledger, Who.fromEnv()))
  } finally {
    ledger.close()
  }
}

export const engineeringModule: FeatureModule = {
  name: 'engineering',

  setup(dir) {
    const home = homeAt(dir)
    if (!home) return []
    const moved = moveLegacyWork(home)
    const made = [home.workRoot, home.backlogRoot, home.adrDir].filter(folder => !existsSync(folder))
    for (const folder of made) mkdirSync(folder, { recursive: true })
    Ledger.open(home.dbFile).close()
    return [...moved, ...made.map(folder => `${relative(dir, folder)}/`)]
  },

  records(dir) {
    const home = Home.find(dir)
    return home ? [home.workRoot, home.backlogRoot] : []
  },

  configured(dir) {
    return !homeAt(dir)?.config.missing
  },

  doctor(dir) {
    const home = homeAt(dir)
    if (!home) return []
    return reading(home, doctor, gap => doctorWithoutLedger(home, { level: 'error', where: home.dir, text: gap.message, ...(gap.fix ? { fix: gap.fix } : {}) }))
  },

  // a ledger gap shows once, from the doctor, so these reads give nothing for it
  retro(dir, since) {
    const home = homeAt(dir)
    return home ? reading(home, eng => retroFacts(eng, since), () => []) : []
  },

  brief(dir, since) {
    const home = homeAt(dir)
    if (!home) return []
    return reading(
      home,
      eng => {
        const about = (ref: string) => {
          const item = eng.stores.items.find(ref)
          return item ? { item: { id: item.id, title: item.title, state: item.state } } : {}
        }
        return [
          ...brief(eng).map(l => ({ part: 'waits' as const, urgent: l.urgency === 'now', text: l.text, action: l.action, ...about(l.ref) })),
          ...doneSince(eng, since).map(l => ({ part: 'done' as const, text: l.text, ...about(l.ref) })),
          ...runs(eng).map(l => ({ part: 'runs' as const, text: l.text, action: l.action, ...about(l.ref) })),
        ]
      },
      () => [],
    )
  },

  gates: GATES,

  gate(dir, words, session) {
    const home = Home.find(dir)
    if (!home) return { ok: false, lines: ['engineering is not on here'] }
    const [move, id, value] = words
    if (!id) return { ok: false, lines: [`give the item: /gate ${move} <id>${move === 'mode' ? ' yolo|normal' : ''}`] }
    // the owner typed the move, so it runs as the owner; the actor marks it in the ledger
    const eng = Engineering.open(home, new Who('owner', 'owner via /gate', session))
    return refusedAsLines(() => {
      if (move === 'mode') {
        if (!value) return { ok: false, lines: [`give the mode: /gate mode ${id} yolo|normal`] }
        return { ok: true, lines: [`${id} mode ${eng.setMode(id, value).mode}`] }
      }
      const result = eng.moveItem(move!, id)
      const after = next(eng, id)[0]
      return {
        ok: true,
        lines: [`${id} is ${result.item.state}`, ...result.warnings.map(w => `warning: ${w}`), ...result.notes, ...(after ? [`next: ${after.skill}`] : [])],
      }
    })
  },

  waiting(dir) {
    const home = Home.find(dir)
    if (!home) return []
    const waits = (eng: Engineering) =>
      next(eng)
        .filter(n => n.skill.startsWith(OWNER_STEP))
        .map(n => ({ words: n.skill.slice(OWNER_STEP.length), why: `${n.id} is ${n.state}, no gap` }))
    return reading(home, waits, () => [])
  },

  commands: ['yolo'],

  command(dir, _name, args, session) {
    const home = Home.find(dir)
    if (!home) return { ok: false, lines: ['engineering is not on here'] }
    const eng = Engineering.open(home, new Who('owner', 'owner via /yolo', session))
    return refusedAsLines(() => {
      const target = autoTarget(eng, args)
      if ('ok' in target) return target
      const item = eng.setMode(target.id, 'yolo')
      const after = next(eng, target.id)[0]
      return { ok: true, lines: [...target.lines, `${item.id} mode ${item.mode}`, ...(after ? [`next: ${after.skill}`] : [])] }
    })
  },
}

const KEY = /^[A-Z][A-Z0-9]*-\d+$/
// a key as people type it: `BKM 14478` or `bkm-14478`; a lower-case word and a number, such as `add 2`, stays words
const LOOSE_KEY = /^(?:([A-Z][A-Z0-9]+)[\s_]+(\d+)|([A-Za-z][A-Za-z0-9]*)-(\d+))(?=\s|$)/

/** The words of a typed /yolo with a loosely typed key first written as the key, such as `BKM 14478 x` as `BKM-14478 x`. */
function withKey(args: string): string {
  const m = LOOSE_KEY.exec(args.trim())
  if (!m) return args.trim()
  const key = `${(m[1] ?? m[3]!).toUpperCase()}-${m[2] ?? m[4]}`
  return `${key}${args.trim().slice(m[0].length)}`
}

/** The item of a typed /yolo: the item that the owner named, a new item from the prompt, or the one open item. */
function autoTarget(eng: Engineering, typed: string): { id: string; lines: string[] } | GateResult {
  const args = withKey(typed)
  const first = args.split(/\s+/)[0] ?? ''
  const named = first && eng.stores.items.find(first)
  if (named) return isOpen(named.state) ? { id: named.id, lines: [] } : { ok: false, lines: [`${named.id} is ${named.state}: /yolo runs an open item`] }
  if (args) {
    const rest = args.slice(first.length).trim()
    const made = eng.newItem(KEY.test(first) ? { id: first, title: rest || first } : { title: args })
    return { id: made.id, lines: [`${made.id} made from the prompt`] }
  }
  const open = eng.stores.items.open()
  if (open.length === 1) return { id: open[0]!.id, lines: [] }
  if (!open.length) return { ok: false, lines: ['no open item: type /yolo <id>, or /yolo and what to build'] }
  return { ok: false, lines: [`several open items: type /yolo with one of ${open.map(i => i.id).join(', ')}`] }
}

/** A refusal of the tool becomes lines for the owner: the reason, then its fix. */
function refusedAsLines(run: () => GateResult): GateResult {
  try {
    return run()
  } catch (error) {
    if (!(error instanceof EvError)) throw error
    return { ok: false, lines: [error.message, ...(error.fix && !error.message.includes(error.fix) ? [`fix: ${error.fix}`] : [])] }
  }
}
