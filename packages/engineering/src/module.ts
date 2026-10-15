import { existsSync, mkdirSync } from 'node:fs'
import { relative } from 'node:path'

import type { PackModule } from '@kit/env/env.ts'

import { Home } from './home.ts'
import { Ledger } from './ledger.ts'
import { doctor } from './report/doctor.ts'
import { Engineering } from './service.ts'
import { Who } from './who.ts'

/** The home of the pack in `dir`, only when `dir` itself turns the pack on: a child does not set up its parent. */
const homeAt = (dir: string): Home | null => {
  const home = Home.find(dir)
  return home && home.dir === dir ? home : null
}

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
}
