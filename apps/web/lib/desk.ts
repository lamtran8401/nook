import { activePacks } from '@nook/desk/desks.ts'
import { type BoardCard, readBoard } from '@nook/engineering/read/reader.ts'

import type { Tab } from '../components/TabLinks.tsx'

/** The folder of the desk that the web app shows, from `NOOK_DESK`. */
export function deskDir(): string {
  const dir = process.env.NOOK_DESK
  if (!dir) throw new Error('NOOK_DESK is not set: start the web app with `nook web`')
  return dir
}

// the packs that have a page in the web app, in the order of the tabs
const PAGES: Record<string, Tab> = {
  engineering: { href: '/works', label: 'Works' },
  wiki: { href: '/wiki', label: 'Wiki' },
  learn: { href: '/learn', label: 'Learn' },
}

/** Home, then a tab for each pack on in the desk that has a page. */
export function packTabs(desk: string): Tab[] {
  const on = new Set(activePacks(desk).map(pack => pack.name))
  return [{ href: '/', label: 'Home' }, ...Object.entries(PAGES).filter(([name]) => on.has(name)).map(([, tab]) => tab)]
}

export const board = (): BoardCard[] => readBoard(deskDir())
