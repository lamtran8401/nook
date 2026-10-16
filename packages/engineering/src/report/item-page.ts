import { uiKit } from '@kit/env/env.ts'
import { usage } from '@kit/shared/errors.ts'

import { dateOf, frontMatter } from '../documents/markdown.ts'
import { TasksDocument } from '../documents/tasks.ts'
import type { ItemDoc } from '../documents/work-folder.ts'
import type { State } from '../machine.ts'
import type { Engineering } from '../service.ts'
import type { Event } from '../stores/events.ts'
import type { Item } from '../stores/items.ts'
import { lanesFigure } from './diagrams.ts'
import { PAGE_LAYOUT, PAGE_SCRIPT } from './page-layout.ts'
import { docTitle, escape, type PageDoc, renderDocument } from './page-markdown.ts'

/** `item page`: one HTML document of an item from its documents and the ledger, built with the UI kit, to open from the disk. */

export type PageSlice = { id: string; title: string; area: string; depends: string[]; acs: number[]; size?: string | null }

type Tab = { doc: PageDoc; file: ItemDoc; name: string; optional?: boolean }

/** The documents of the page; an optional one shows only when its file exists. */
const TABS: Tab[] = [
  { doc: 'spec', file: 'spec.md', name: 'Spec' },
  { doc: 'plan', file: 'plan.md', name: 'Plan' },
  { doc: 'tasks', file: 'tasks.md', name: 'Tasks' },
  { doc: 'walkthrough', file: 'walkthrough.md', name: 'Walkthrough', optional: true },
]
const AUDIT_MOVES = ['start', 'agree', 'approve', 'begin', 'submit', 'accept']

/** The tab that the owner reads in each state, when the page names none. */
const STATE_TAB: Record<State, PageDoc> = {
  backlog: 'spec',
  framing: 'spec',
  planning: 'plan',
  ready: 'plan',
  cooking: 'tasks',
  checking: 'walkthrough',
  done: 'walkthrough',
  blocked: 'spec',
  cancelled: 'spec',
}

/** A whole HTML document with the UI kit, to open from the disk. */
function pageDocument(title: string, body: string[]): string {
  const kit = uiKit()
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escape(title)}</title>`,
    `<style>${kit.css}\n${PAGE_LAYOUT}</style>`,
    '</head>',
    '<body>',
    '<div class="bn-root kd-page">',
    ...body,
    '</div>',
    `<script>${kit.js}</script>`,
    `<script>${PAGE_SCRIPT}</script>`,
    '</body>',
    '</html>',
  ].join('\n')
}

/** The page of an item, open on `open` (a tab name such as `walkthrough`), else on the tab of its state, else on its first tab. */
export function itemPage(eng: Engineering, id: string, open?: string): string {
  const item = eng.item(id)
  const folder = eng.folder(id)
  const texts = new Map(TABS.map(tab => [tab.file, folder.read(tab.file)]))
  const tabs = TABS.filter(tab => !tab.optional || texts.get(tab.file) !== null)
  const shown = open === undefined ? (tabs.find(tab => tab.doc === STATE_TAB[item.state]) ?? tabs[0]!) : tabs.find(tab => tab.doc === open)
  if (!shown) throw usage(`${item.id} has no ${open} tab; its tabs: ${tabs.map(tab => tab.doc).join(', ')}`)
  const slices = slicesOf(eng, id, texts.get('tasks.md') ?? null)
  return pageDocument(`${item.id}: ${item.title}`, [
    header(item, eng.stores.events.history(id), texts),
    '<div class="bn-tabs" data-bn-tabs>',
    tabList(tabs, shown),
    ...tabs.map(tab => panel(item, tab, texts.get(tab.file) ?? null, slices, tab === shown)),
    '</div>',
  ])
}

/** `doc page`: one Markdown document with no item, such as the walkthrough of a question, in the look of the item page. */
export function docPage(path: string, text: string): string {
  const title = docTitle(text) ?? path
  return pageDocument(title, [
    `<header class="kd-head"><span class="kd-eyebrow">${escape(path)}</span><h1 class="bn-page-head__title">${escape(title)}</h1></header>`,
    renderDocument(text, 'walkthrough'),
  ])
}

/** The slices of the ledger; before the import, the slices of tasks.md. */
function slicesOf(eng: Engineering, id: string, tasks: string | null): PageSlice[] {
  const live = eng.stores.slices.live(id)
  if (live.length || tasks === null) return live
  return TasksDocument.parse(tasks).slices
}

/** The slices that start first, and the slices of different areas that can run side by side. */
export function laneNote(slices: PageSlice[]): string {
  if (!slices.length) return ''
  const first = slices.filter(s => !s.depends.length).map(s => s.id)
  const waves = groupBy(slices, s => String(depth(s.id, slices)))
  const beside = [...waves.values()]
    .map(wave => groupBy(wave, s => s.area))
    .filter(areas => areas.size > 1)
    .map(areas => [...areas].map(([area, list]) => `${list.map(s => s.id).join(', ')} (${area})`).join(' with '))
  const start = `Start first: ${first.join(', ') || 'none'}.`
  return beside.length
    ? `${start} Side by side in different areas: ${beside.join('; then ')}.`
    : `${start} No two areas run at the same time.`
}

/** The length of the longest `depends` path under a slice; a cycle counts as no path. */
function depth(id: string, slices: PageSlice[], seen = new Set<string>()): number {
  const slice = slices.find(s => s.id === id)
  if (!slice || seen.has(id)) return 0
  const next = new Set(seen).add(id)
  const deps = slice.depends.filter(d => slices.some(s => s.id === d) && !next.has(d))
  return deps.length ? 1 + Math.max(...deps.map(d => depth(d, slices, next))) : 0
}

function groupBy<T>(list: T[], key: (entry: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const entry of list) groups.set(key(entry), [...(groups.get(key(entry)) ?? []), entry])
  return groups
}

/** The dates of the moves that happened, then the `updated` date of each document. */
export function auditLine(events: Event[], texts: Map<ItemDoc, string | null>): string {
  const moves = AUDIT_MOVES.flatMap(move => {
    const last = events.filter(e => e.type === move || (move === 'approve' && e.type === 'proceed')).at(-1)
    return last ? [`${move} ${last.at.slice(0, 10)}`] : []
  })
  const files = [...texts].flatMap(([file, text]) => {
    if (text === null) return []
    return [`${file} updated ${dateOf(frontMatter(text).updated) ?? 'no date'}`]
  })
  return [...moves, ...files].join(' · ')
}

const badge = (text: string, attrs = '') => `<span class="bn-badge" data-size="sm"${attrs}>${escape(text)}</span>`

function header(item: Item, events: Event[], texts: Map<ItemDoc, string | null>): string {
  const badges = [
    badge(item.state, ' data-tone="primary"'),
    badge(`kind ${item.kind}`, ' data-variant="outline"'),
    badge(`size ${item.size}`, ' data-variant="outline"'),
    ...item.areas.map(a => badge(a, ' data-variant="plain"')),
  ]
  const audit = auditLine(events, texts)
  return [
    '<header class="kd-head">',
    `<span class="kd-eyebrow">Item ${escape(item.id)}</span>`,
    `<h1 class="bn-page-head__title">${escape(item.title)}</h1>`,
    `<div class="bn-row">${badges.join('')}</div>`,
    audit ? `<p class="kd-audit">${escape(audit)}</p>` : '',
    '</header>',
  ].join('')
}

const tabList = (tabs: Tab[], shown: Tab) =>
  `<div class="bn-tabs__list" role="tablist" aria-label="Documents of the item">${tabs.map(
    tab =>
      `<button type="button" class="bn-tabs__tab" role="tab" id="tab-${tab.doc}" data-doc="${tab.doc}" aria-controls="panel-${tab.doc}" aria-selected="${tab === shown}" tabindex="${tab === shown ? 0 : -1}">${tab.name}</button>`,
  ).join('')}</div>`

function panel(item: Item, tab: Tab, text: string | null, slices: PageSlice[], shown: boolean): string {
  const front = text === null ? {} : frontMatter(text)
  const meta = [
    `work/${item.id}/${tab.file}`,
    ...Object.entries(front)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} ${metaValue(value)}`),
  ]
  const title = text === null ? null : docTitle(text)
  const head = `<div class="kd-doc-head"><p class="kd-doc-meta">${meta.map(escape).join(' · ')}</p>${title ? `<h2 class="kd-doc-title">${escape(title)}</h2>` : ''}</div>`
  const lanes = tab.doc === 'tasks' ? lanesSection(item, slices) : ''
  const body = text === null ? `<p class="kd-empty">${tab.file} is not written yet.</p>${lanes}` : renderDocument(text, tab.doc, lanes)
  return `<div class="bn-tabs__panel" role="tabpanel" id="panel-${tab.doc}" aria-labelledby="tab-${tab.doc}"${shown ? '' : ' hidden'}>${head}${body}</div>`
}

const metaValue = (value: unknown) =>
  Array.isArray(value) ? value.join(', ') : value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '')

function lanesSection(item: Item, slices: PageSlice[]): string {
  if (!slices.length) return `<p class="kd-empty">No slices yet: kit eng task import ${escape(item.id)}.</p>`
  return `<section class="kd-sec"><h2 class="kd-sec__title">Lanes</h2>${lanesFigure(slices)}<p class="kd-lanes-note">${escape(laneNote(slices))}</p></section>`
}
