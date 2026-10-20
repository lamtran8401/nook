import { notFound } from 'next/navigation'

import { EvError } from '@nook/shared/errors.ts'

import { type HomeView, readHome } from '@nook/core/read.ts'
import { activePacks } from '@nook/desk/desks.ts'
import { engineeringModule } from '@nook/engineering/module.ts'
import { type BoardCard, type ItemDocs, type ItemView, readAreas, readBoard, readDocs, readItem, readMetrics } from '@nook/engineering/read/reader.ts'
import type { Metrics } from '@nook/engineering/report/metrics.ts'
import { learnModule } from '@nook/learn/module.ts'
import { type CourseView, readLearn } from '@nook/learn/read.ts'
import { wikiModule } from '@nook/wiki/module.ts'
import { type PageView, readPage, readWiki, type WikiView } from '@nook/wiki/read.ts'
import { type EventGroup, groupEvents } from '@nook/core/retro/retro.ts'
import { dayOf, type DeskEvent, readEvents } from '@nook/desk/events.ts'
import { type PackPart, packParts } from '@nook/desk/pack-parts.ts'
import { type EngineeringSettings, readSettings } from '@nook/engineering/read/reader.ts'
import { METRICS_SPAN_MS } from '@nook/engineering/report/metrics.ts'

import { type DeskRef, deskBySlug } from '@/lib/desks.ts'
import { type Hit, search } from '@/lib/search.ts'

/** The desk of a page from its `[desk]` segment; a segment of no desk of the list is a 404. */
export async function openDesk(params: Promise<{ desk: string }>): Promise<DeskRef & { base: string }> {
  const desk = deskBySlug(decodeURIComponent((await params).desk))
  if (!desk) notFound()
  return { ...desk, base: `/${desk.slug}` }
}

/** A page of the sidebar: its address under the desk, and the pack that it needs, when one. */
export type DeskPage = { key: string; label: string; path: string; pack?: string; footer?: boolean }

// the pages of the sidebar in their order; a page with a pack shows only when the pack is on in the desk
const PAGES: DeskPage[] = [
  { key: 'home', label: 'Home', path: '' },
  { key: 'works', label: 'Works', path: '/works', pack: 'engineering' },
  { key: 'wiki', label: 'Wiki', path: '/wiki', pack: 'wiki' },
  { key: 'learn', label: 'Learn', path: '/learn', pack: 'learn' },
  { key: 'metrics', label: 'Metrics', path: '/metrics', pack: 'engineering' },
  { key: 'agents', label: 'Agents and skills', path: '/agents' },
  { key: 'events', label: 'Events', path: '/events' },
  { key: 'settings', label: 'Settings', path: '/settings', footer: true },
]

/** The pages of a desk that its packs turn on. */
export function deskPages(dir: string): DeskPage[] {
  const on = new Set(activePacks(dir).map(pack => pack.name))
  return PAGES.filter(page => !page.pack || on.has(page.pack))
}

// the packs of the nook binary that read the disk only, so the home page gives what `nook brief` and `nook doctor` give;
// issue-tracker asks each tracker for its login, so its gaps stay with `nook doctor` and `nook issues sources`
const MODULES = [engineeringModule, wikiModule, learnModule]

export const home = (dir: string): HomeView => readHome(dir, MODULES)
export const board = (dir: string): BoardCard[] => readBoard(dir)

/** The count of open items for the side nav; none when the ledger cannot be read, since the page shows that gap with its fix. */
export function openCount(dir: string): number | undefined {
  try {
    return readBoard(dir).filter(card => card.state !== 'done').length
  } catch (error) {
    if (error instanceof EvError) return undefined
    throw error
  }
}
export const metrics = (dir: string): Metrics | null => readMetrics(dir)
export const deskAreas = (dir: string): string[] => readAreas(dir)
export const itemView = (dir: string, id: string): ItemView => readItem(dir, id)
export const item = (dir: string, id: string): { view: ItemView; docs: ItemDocs } => ({ view: itemView(dir, id), docs: readDocs(dir, id) })
export const wiki = (dir: string): WikiView | null => readWiki(dir)
export const wikiPage = (dir: string, path: string): PageView => readPage(dir, path)
export const courses = (dir: string): CourseView[] => readLearn(dir)
export const find = (dir: string, query: string, base: string): Hit[] => search(dir, query, base)
export const parts = (dir: string): PackPart[] => packParts(dir)

/** The guard blocks of the last 30 days, each reason once with its count, the most frequent first. */
export const blocks = (dir: string, now = new Date()): EventGroup[] => groupEvents(readEvents(dir, { kind: 'block', since: new Date(now.getTime() - METRICS_SPAN_MS) }))

/** The events of the log, newest first, of one kind and one day when given. */
export function events(dir: string, filter: { kind?: DeskEvent['kind']; day?: string } = {}): DeskEvent[] {
  const all = readEvents(dir, filter.kind ? { kind: filter.kind } : {})
  return (filter.day ? all.filter(event => dayOf(new Date(event.at)) === filter.day) : all).reverse()
}

/** What the settings page shows: the packs, the file of the desk, and the engineering home when there is one. */
export type DeskSettings = { packs: string[]; file: string; engineering: EngineeringSettings | null }
export const settings = (dir: string): DeskSettings => ({ packs: ['core', ...activePacks(dir).map(p => p.name).filter(n => n !== 'core')], file: `${dir}/nook.yml`, engineering: readSettings(dir) })
