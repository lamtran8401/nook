import { dateOf, frontMatter } from '../documents/markdown.ts'
import { TasksDocument } from '../documents/tasks.ts'
import type { WorkDoc } from '../documents/work-folder.ts'
import type { Engineering } from '../service.ts'
import type { Event } from '../stores/events.ts'
import type { Item } from '../stores/items.ts'
import { lanesFigure } from './diagrams.ts'
import { escape, type PageDoc, renderDocument } from './page-markdown.ts'
import { PAGE_FONTS, PAGE_STYLE } from './page-style.ts'

/** `item page`: one HTML page of an item from its three documents and the ledger, for the artifact viewer. */

export type PageSlice = { id: string; title: string; area: string; depends: string[]; acs: number[] }

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
  return [
    `<title>${escape(`${item.id}: ${item.title}`)}</title>`,
    '<meta name="claude:viewport-fit-sides" content="cover">',
    PAGE_FONTS,
    `<style>${PAGE_STYLE}</style>`,
    '<div class="page">',
    header(item, eng.stores.events.history(id), texts),
    tabBar(),
    `<main class="panels">${TABS.map((tab, i) => panel(item, tab, texts.get(tab.file) ?? null, slices, i === 0)).join('\n')}</main>`,
    '</div>',
    `<script>${TAB_SCRIPT}</script>`,
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

function header(item: Item, events: Event[], texts: Map<WorkDoc, string | null>): string {
  const chips = [
    `<span class="chip state"><b>state</b> ${escape(item.state)}</span>`,
    `<span class="chip"><b>kind</b> ${escape(item.kind)}</span>`,
    `<span class="chip"><b>size</b> ${escape(item.size)}</span>`,
    ...item.areas.map(a => `<span class="chip area">${escape(a)}</span>`),
  ]
  const audit = auditLine(events, texts)
  return `<header class="hero"><span class="label">Item ${escape(item.id)}</span><h1>${escape(`${item.id}: ${item.title}`)}</h1><div class="chips">${chips.join('')}</div>${audit ? `<p class="audit">${escape(audit)}</p>` : ''}</header>`
}

const tabBar = () =>
  `<nav class="bar" aria-label="Documents"><div class="seg" role="tablist" aria-label="Documents of the item">${TABS.map(
    (tab, i) =>
      `<button type="button" role="tab" data-tab="${tab.doc}" aria-selected="${i === 0}">${tab.name}</button>`,
  ).join('')}</div></nav>`

function panel(item: Item, tab: (typeof TABS)[number], text: string | null, slices: PageSlice[], shown: boolean): string {
  const front = text === null ? {} : frontMatter(text)
  const chips = [
    `<span class="chip path">work/${escape(item.id)}/${tab.file}</span>`,
    ...Object.entries(front)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `<span class="chip"><b>${escape(key)}</b> ${escape(chipValue(value))}</span>`),
  ]
  const lanesPart = tab.doc === 'tasks' ? lanesSection(item, slices) : ''
  const body = text === null ? `<p class="empty">${tab.file} is not written yet.</p>` : renderDocument(text, tab.doc)
  return `<div class="panel${shown ? '' : ' is-hidden'}" role="tabpanel" data-panel="${tab.doc}"${shown ? '' : ' aria-hidden="true"'}><div class="chips">${chips.join('')}</div>${lanesPart}<article class="doc">${body}</article></div>`
}

const chipValue = (value: unknown) =>
  Array.isArray(value) ? value.join(', ') : value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '')

function lanesSection(item: Item, slices: PageSlice[]): string {
  if (!slices.length)
    return `<p class="empty">No slices yet: kit eng task import ${escape(item.id)}.</p>`
  return `<section class="sec"><h3><span class="label">Lanes from the ledger</span></h3>${lanesFigure(slices)}<p class="lanes-note">${escape(laneNote(slices))}</p></section>`
}

const TAB_SCRIPT = `
(function () {
  var tabs = document.querySelectorAll('[data-tab]')
  var panels = document.querySelectorAll('[data-panel]')
  function show(name) {
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)) })
    panels.forEach(function (p) {
      var off = p.dataset.panel !== name
      p.classList.toggle('is-hidden', off)
      if (off) p.setAttribute('aria-hidden', 'true'); else p.removeAttribute('aria-hidden')
    })
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      show(b.dataset.tab)
      try { history.replaceState(null, '', '#' + b.dataset.tab) } catch (e) {}
    })
  })
  var start = location.hash.replace('#', '')
  if (start === 'spec' || start === 'plan' || start === 'tasks') show(start)
  // a diagram wider than the screen opens at its middle; the viewer draws mermaid after load, so this runs a few times
  function center() {
    document.querySelectorAll('.dg-wrap').forEach(function (w) {
      if (w.dataset.centered || !w.querySelector('svg')) return
      if (w.scrollWidth > w.clientWidth) w.scrollLeft = (w.scrollWidth - w.clientWidth) / 2
      w.dataset.centered = '1'
    })
  }
  ;[300, 1000, 2500].forEach(function (ms) { setTimeout(center, ms) })
})()
`
