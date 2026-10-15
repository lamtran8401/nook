import type { Database } from 'bun:sqlite'

import { conflict } from '@kit/shared/errors.ts'

import { dbFile, type Home, requireHome } from './home.ts'
import { openDb } from './db.ts'
import { type Who, whoFromEnv } from './role.ts'

/** What every command works with: the home, the open ledger and the caller. */
export type Kit = { home: Home; db: Database; who: Who }

export function openKit(cwd = process.cwd(), who: Who = whoFromEnv()): Kit {
  const home = requireHome(cwd)
  return { home, db: openDb(dbFile(home)), who }
}

/** `--if-version <n>`: the record must still be at the version the caller read. */
export function assertVersion(what: string, version: number, wanted: string | undefined): void {
  if (wanted === undefined) return
  if (Number(wanted) !== version) throw conflict(`${what} is at version ${version}, not ${wanted}`, 'read it again, then repeat the command with the new version')
}
