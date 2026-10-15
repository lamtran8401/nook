import { uiKit } from '@kit/env/env.ts'

import { dateOf, frontMatter } from '../documents/markdown.ts'
import { TasksDocument } from '../documents/tasks.ts'
import type { WorkDoc } from '../documents/work-folder.ts'
import type { Engineering } from '../service.ts'
import type { Event } from '../stores/events.ts'
import type { Item } from '../stores/items.ts'
import { lanesFigure } from './diagrams.ts'
import { PAGE_LAYOUT, PAGE_SCRIPT } from './page-layout.ts'
import { docTitle, escape, type PageDoc, renderDocument } from './page-markdown.ts'

/** `item page`: one HTML page of an item from its three documents and the ledger, built with the UI kit, for the artifact viewer. */

export type PageSlice = { id: string; title: string; area: string; depends: string[]; acs: number[]; size?: string | null }

const TABS: { doc: PageDoc; file: WorkDoc; name: string }[] = [
  { doc: 'spec', file: 'spec.md', name: 'Spec' },
  { doc: 'plan', file: 'plan.md', name: 'Plan' },
  { doc: 'tasks', file: 'tasks.md', name: 'Tasks' },
]
const AUDIT_MOVES = ['start', 'agree', 'approve', 'begin', 'submit', 'accept']

export function itemPage(eng: Engineering, id: string): string {
  const item = eng.item(id)
  const folder = eng.folder(id)
  const texts = new Map(TABS.map(tab => [tab.file, folder.read(tab.file)]))
  const slices = slicesOf(eng, id, texts.get('tasks.md') ?? null)
  const kit = uiKit()
  return [
    `<title>${escape(`${item.id}: ${item.title}`)}</title>`,
    '<meta name="claude:viewport-fit-sides" content="cover">',
    `<style>${kit.css}\n${PAGE_LAYOUT}</style>`,
    '<div class="bn-root kd-page">',
    header(item, eng.stores.events.history(id), texts),
    '<div class="bn-tabs" data-bn-tabs>',
    tabList(),
    ...TABS.map((tab, i) => panel(item, tab, texts.get(tab.file) ?? null, slices, i === 0)),
    '</div>',
    '</div>',
    `<script>${kit.js}</script>`,
    `<script>${PAGE_SCRIPT}</script>`,
  ].join('\n')
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
export function auditLine(events: Event[], texts: Map<WorkDoc, string | null>): string {
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

function header(item: Item, events: Event[], texts: Map<WorkDoc, string | null>): string {
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

const tabList = () =>
  `<div class="bn-tabs__list" role="tablist" aria-label="Documents of the item">${TABS.map(
    (tab, i) =>
      `<button type="button" class="bn-tabs__tab" role="tab" id="tab-${tab.doc}" data-doc="${tab.doc}" aria-controls="panel-${tab.doc}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${tab.name}</button>`,
  ).join('')}</div>`

function panel(item: Item, tab: (typeof TABS)[number], text: string | null, slices: PageSlice[], shown: boolean): string {
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
