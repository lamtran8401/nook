import { basename, relative } from 'node:path'

import { notFound } from 'next/navigation'

import { EvError } from '@nook/shared/errors.ts'

import { type HomeView, readHome } from '@nook/core/read.ts'
import { activeFeatures, type Budget, type Commands, commandsAbove, rulesAt, secretsAbove, Workspace } from '@nook/workspace/workspaces.ts'
import { ALWAYS_SECRET } from '@nook/workspace/secrets.ts'
import { engineeringModule } from '@nook/engineering/module.ts'
import { type BoardCard, type ItemDocs, type ItemView, readAreas, readBoard, readDocs, readItem, readMetrics, type Receipt, readReceipts, readTrend } from '@nook/engineering/read/reader.ts'
import type { Metrics } from '@nook/engineering/report/metrics.ts'
import { wikiModule } from '@nook/wiki/module.ts'
import { type PageView, readPage, readWiki, type WikiView } from '@nook/wiki/read.ts'
import { type EventGroup, groupEvents } from '@nook/core/retro/retro.ts'
import { dayOf, type WorkspaceEvent, readEvents } from '@nook/workspace/events.ts'
import { type Hook, hooks, type Part, parts as pluginParts } from '@nook/workspace/parts.ts'
import { type EngineeringSettings, readSettings } from '@nook/engineering/read/reader.ts'
import { METRICS_SPAN_MS } from '@nook/engineering/report/metrics.ts'

import { type WorkspaceRef, workspaceBySlug } from '@/lib/workspaces.ts'
import { type Hit, search } from '@/lib/search.ts'

/** The workspace of a page from its `[workspace]` segment; a segment of no workspace of the list is a 404. */
export async function openWorkspace(params: Promise<{ workspace: string }>): Promise<WorkspaceRef & { base: string }> {
  const workspace = workspaceBySlug(decodeURIComponent((await params).workspace))
  if (!workspace) notFound()
  return { ...workspace, base: `/${workspace.slug}` }
}

/** A page of the sidebar: its address under the workspace, and the feature that it needs, when one. */
export type WorkspacePage = { key: string; label: string; path: string; feature?: string; footer?: boolean }

// the pages of the sidebar in their order; a page with a feature shows only when the feature is on in the workspace
const PAGES: WorkspacePage[] = [
  { key: 'home', label: 'Home', path: '' },
  { key: 'works', label: 'Board', path: '/works', feature: 'engineering' },
  { key: 'wiki', label: 'Wiki', path: '/wiki', feature: 'wiki' },
  { key: 'metrics', label: 'Metrics', path: '/metrics', feature: 'engineering' },
  { key: 'agents', label: 'Agents and skills', path: '/agents' },
  { key: 'events', label: 'Events', path: '/events' },
  { key: 'harness', label: 'Harness', path: '/harness', footer: true },
]

/** The pages of a workspace that its features turn on. */
export function workspacePages(dir: string): WorkspacePage[] {
  const on = new Set<string>(activeFeatures(dir).map(feature => feature.name))
  return PAGES.filter(page => !page.feature || on.has(page.feature))
}

// the features of the nook binary that read the disk only, so the home page gives what `nook brief` and `nook doctor` give;
// issue-tracker asks each tracker for its login, so its gaps stay with `nook doctor` and `nook issues sources`
const MODULES = [engineeringModule, wikiModule]

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
export const trend = (dir: string): Metrics[] | null => readTrend(dir)
export const receipts = (dir: string, since: Date): Receipt[] => readReceipts(dir, since)
export const workspaceAreas = (dir: string): string[] => readAreas(dir)
export const itemView = (dir: string, id: string): ItemView => readItem(dir, id)
export const item = (dir: string, id: string): { view: ItemView; docs: ItemDocs } => ({ view: itemView(dir, id), docs: readDocs(dir, id) })
export const wiki = (dir: string): WikiView | null => readWiki(dir)
export const wikiPage = (dir: string, path: string): PageView => readPage(dir, path)
export const find = (dir: string, query: string, base: string): Hit[] => search(dir, query, base)
export const parts = (): Part[] => pluginParts()

/** The guard blocks of the last 30 days, each reason once with its count, the most frequent first. */
export const blocks = (dir: string, now = new Date()): EventGroup[] => groupEvents(readEvents(dir, { kind: 'block', since: new Date(now.getTime() - METRICS_SPAN_MS) }))

/** The events of the log, newest first, of one kind and one day when given. */
export function events(dir: string, filter: { kind?: WorkspaceEvent['kind']; day?: string } = {}): WorkspaceEvent[] {
  const all = readEvents(dir, filter.kind ? { kind: filter.kind } : {})
  return (filter.day ? all.filter(event => dayOf(new Date(event.at)) === filter.day) : all).reverse()
}

/** What the harness page shows: each feature and the workspace it comes from, the budget, the guards, the rules, the hooks, the file, and the engineering home when there is one. */
export type Harness = {
  features: { name: string; from: string | null }[]
  budget: Budget | null
  secrets: { always: string[]; listed: string[] }
  commands: Commands
  rules: { name: string; on: boolean }[]
  hooks: Hook[]
  file: string
  engineering: EngineeringSettings | null
}

export function harness(dir: string): Harness {
  return {
    features: activeFeatures(dir).map(f => ({ name: f.name, from: f.home.dir === dir ? null : basename(f.home.dir) })),
    budget: Workspace.read(dir).config.budget,
    secrets: { always: ALWAYS_SECRET, listed: secretsAbove(dir).map(file => relative(dir, file)) },
    commands: commandsAbove(dir),
    rules: rulesAt(dir),
    hooks: hooks(),
    file: `${dir}/nook.yml`,
    engineering: readSettings(dir),
  }
}
