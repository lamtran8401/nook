import { Home } from '@nook/engineering/home.ts'
import { Ledger } from '@nook/engineering/ledger.ts'

export type ItemRow = { id: string; title: string; state: string }

/** The folder of the desk that the web app shows, from `NOOK_DESK`. */
export function deskDir(): string {
  const dir = process.env.NOOK_DESK
  if (!dir) throw new Error('NOOK_DESK is not set: start the web app with `nook web`')
  return dir
}

/** The items of the desk, read through the read-only ledger. */
export function readItems(desk = deskDir()): ItemRow[] {
  const ledger = Ledger.openReadOnly(Home.require(desk).dbFile)
  try {
    return ledger.all<ItemRow>('SELECT id, title, state FROM item ORDER BY id')
  } finally {
    ledger.close()
  }
}
