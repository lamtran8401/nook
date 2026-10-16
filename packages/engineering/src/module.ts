import { existsSync, mkdirSync } from 'node:fs'
import { relative } from 'node:path'

import type { GateResult, PackModule } from '@kit/env/env.ts'
import { EvError } from '@kit/shared/errors.ts'

import { Home } from './home.ts'
import { Ledger } from './ledger.ts'
import { OWNER_STEP } from './owner-step.ts'
import { doctor } from './report/doctor.ts'
import { next } from './report/next.ts'
import { Engineering } from './service.ts'
import { Who } from './who.ts'

/** The home of the pack in `dir`, only when `dir` itself turns the pack on: a child does not set up its parent. */
const homeAt = (dir: string): Home | null => {
  const home = Home.find(dir)
  return home && home.dir === dir ? home : null
}

const GATES = ['approve', 'accept', 'mode'] as const

export const engineeringModule: PackModule = {
  name: 'engineering',

  setup(dir) {
    const home = homeAt(dir)
    if (!home) return []
    const made = [home.workRoot, home.backlogRoot, home.adrDir].filter(folder => !existsSync(folder))
    for (const folder of made) mkdirSync(folder, { recursive: true })
    Ledger.open(home.dbFile).close()
    return made.map(folder => `${relative(dir, folder)}/`)
  },

  configured(dir) {
    return !homeAt(dir)?.config.missing
  },

  doctor(dir) {
    const home = homeAt(dir)
    return home ? doctor(Engineering.open(home, Who.fromEnv())) : []
  },

  gates: GATES,

  gate(dir, words, session) {
    const home = Home.find(dir)
    if (!home) return { ok: false, lines: ['the engineering pack is not on here'] }
    const [move, id, value] = words
    if (!id) return { ok: false, lines: [`give the item: /gate ${move} <id>${move === 'mode' ? ' auto|normal' : ''}`] }
    // the owner typed the move, so it runs as the owner; the actor marks it in the ledger
    const eng = Engineering.open(home, new Who('owner', 'owner via /gate', session))
    return refusedAsLines(() => {
      if (move === 'mode') {
        if (!value) return { ok: false, lines: [`give the mode: /gate mode ${id} auto|normal`] }
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
    return next(Engineering.open(home, Who.fromEnv()))
      .filter(n => n.skill.startsWith(OWNER_STEP))
      .map(n => ({ words: n.skill.slice(OWNER_STEP.length), why: `${n.id} is ${n.state}, no gap` }))
  },
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
