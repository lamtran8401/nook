import { type HomeView, readHome } from '@nook/core/read.ts'
import { activePacks } from '@nook/desk/desks.ts'
import { engineeringModule } from '@nook/engineering/module.ts'
import { type BoardCard, type ItemDocs, type ItemView, readAreas, readBoard, readDocs, readItem } from '@nook/engineering/read/reader.ts'
import { learnModule } from '@nook/learn/module.ts'
import { type CourseView, readLearn } from '@nook/learn/read.ts'
import { wikiModule } from '@nook/wiki/module.ts'
import { type PageView, readPage, readWiki, type WikiView } from '@nook/wiki/read.ts'

import type { Tab } from '@/components/pack-nav.tsx'
import { type Hit, search } from '@/lib/search.ts'

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

// the same packs as the nook binary, so the home page gives what `nook brief` and `nook doctor` give
const MODULES = [engineeringModule, wikiModule, learnModule]

export const home = (): HomeView => readHome(deskDir(), MODULES)
export const board = (): BoardCard[] => readBoard(deskDir())
export const deskAreas = (): string[] => readAreas(deskDir())
export const itemView = (id: string): ItemView => readItem(deskDir(), id)
export const item = (id: string): { view: ItemView; docs: ItemDocs } => ({ view: itemView(id), docs: readDocs(deskDir(), id) })
export const wiki = (): WikiView | null => readWiki(deskDir())
export const wikiPage = (path: string): PageView => readPage(deskDir(), path)
export const courses = (): CourseView[] => readLearn(deskDir())
export const find = (query: string): Hit[] => search(deskDir(), query)
