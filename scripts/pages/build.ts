import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { uiKit } from '@nook/desk/ui-kit.ts'

/**
 * The two pages of the docs, the guide book and the build report, built from the Markdown of `docs/`.
 * The Markdown is the source; a page is a view of it. The numbers of the report come from the tables of `report.md`.
 */

export type Pages = { guide: string; report: string }
type Tab = { id: string; label: string }
type LinkMap = (href: string, text: string) => string | null

const HERE = import.meta.dir
const GUIDE_FILES = ['README.md', '01-start.md', '02-desks.md', '03-day.md', '04-work.md', '05-wiki.md', '06-learn.md', '07-blocks.md']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const stripTags = (s: string) => unesc(s.replace(/<[^>]+>/g, '')).trim()
const md = (text: string) => Bun.markdown.html(text)

type Spec = Record<string, unknown>
type TreeItem = { name: string; note?: string; icon?: string; children?: TreeItem[] }

/** One diagram of the Bench bundle: the spec rides in the page, and `Bench.diagram` draws it. */
const figure = (spec: Spec, caption = '') =>
  `<figure class="fig"><div data-bn-diagram><script type="application/json">${JSON.stringify(spec).replace(/</g, '\\u003c')}</script></div>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`
const legend = (items: [tone: string, text: string][]) =>
  `<span class="bn-legend">${items.map(([tone, text]) => `<span data-tone="${tone}">${text}</span>`).join('')}</span>`

/** An ASCII tree (├── └── │) as the spec of a Bench tree. A row is a name, two spaces or more, then a note. */
export function treeSpec(text: string): { type: 'filetree'; items: TreeItem[] } {
  const root: TreeItem[] = []
  const stack: { depth: number; items: TreeItem[] }[] = [{ depth: -1, items: root }]
  for (const line of text.replace(/\n$/, '').split('\n')) {
    const [, indent = '', branch, rest = ''] = line.match(/^((?:│   |    )*)(├── |└── )?(.*)$/) ?? []
    const [name = '', ...note] = rest.split(/\s{2,}/)
    const depth = (branch ? 1 : 0) + [...indent].length / 4
    const item: TreeItem = { name: name.trim(), ...(note.length ? { note: note.join(' ').trim() } : {}) }
    while (stack.at(-1)!.depth >= depth) stack.pop()
    const parent = stack.at(-1)!.items
    parent.push(item)
    stack.push({ depth, items: (item.children = []) })
  }
  // a name that ends in / is a folder, also with nothing under it
  const prune = (items: TreeItem[]): TreeItem[] =>
    items.map(i =>
      i.children?.length
        ? { ...i, children: prune(i.children) }
        : { name: i.name, ...(i.note ? { note: i.note } : {}), ...(i.name.endsWith('/') ? { icon: 'folder' } : {}) })
  return { type: 'filetree', items: prune(root) }
}

/** The tones of the phases of an item, the same in the flow and the paths. */
const PHASE_TONE = { wait: 'neutral', plan: 'primary', build: 'warning', check: 'aqua', done: 'success' } as const
const PHASE_LEGEND: [string, string][] = [['neutral', 'waiting'], ['primary', 'frame and plan'], ['warning', 'build'], ['aqua', 'check'], ['success', 'done']]

function flowDiagram(): string {
  const state = (id: string, at: [number, number], meta: string, tone: string) => ({ id, at, title: id, meta, tone })
  return figure(
    {
      type: 'graph', cols: 3, colGap: 52, rowGap: 40,
      nodes: [
        state('backlog', [1, 1], '/intake', PHASE_TONE.wait), state('framing', [1, 2], '/spec', PHASE_TONE.plan),
        state('planning', [1, 3], '/recipe', PHASE_TONE.plan), state('ready', [2, 3], 'approved', PHASE_TONE.plan),
        state('cooking', [2, 2], '/cook', PHASE_TONE.build), state('review', [3, 2], '/deep-review', PHASE_TONE.check),
        state('done', [3, 3], '/close', PHASE_TONE.done),
      ],
      edges: [
        { from: 'backlog', to: 'framing', label: 'start' }, { from: 'framing', to: 'planning', label: 'agree' },
        { from: 'planning', to: 'ready', label: '★ approve', tone: 'primary', main: true },
        { from: 'ready', to: 'cooking', label: 'begin' },
        { from: 'cooking', to: 'review', label: 'submit' },
        { from: 'review', to: 'done', label: '★ accept', tone: 'primary', main: true },
        { from: 'ready', to: 'planning', label: 'replan', dash: true, a: 'r', b: 'r', bend: 18 },
        { from: 'review', to: 'cooking', label: 'reject', dash: true, a: 'l', b: 'l', bend: 46 },
        { from: 'done', to: 'cooking', label: 'reopen', dash: true },
      ],
    },
    `${legend(PHASE_LEGEND)}The states of an item. ★ marks a gate: only you take it, with <code>/gate</code>. Under each state: the command that works on it.`,
  )
}

function pathsDiagram(): string {
  const PHASE: Record<string, string> = {
    '/intake': 'wait', '/spec': 'plan', '/recipe': 'plan', 'one criterion': 'plan', spec: 'plan', plan: 'plan', proceed: 'plan',
    '/cook': 'build', '/quick': 'build', 'test first': 'build', build: 'build', '/yolo': 'wait',
    '/deep-review': 'check', proof: 'check', review: 'check', '/guesses': 'check', '/close': 'done',
  }
  const lanes: [string, string[]][] = [
    ['Full: a feature or a contract', ['/intake', '/spec', '/recipe', '★ approve', '/cook', '/deep-review', '★ accept', '/close']],
    ['Quick: one area, size S', ['/quick', 'one criterion', 'test first', 'proof', '★ accept', '/close']],
    ['Yolo: it runs alone', ['/yolo', 'spec', 'plan', 'proceed', 'build', 'review', '★ accept', '/guesses']],
  ]
  const nodes = lanes.flatMap(([, steps], c) =>
    steps.map((step, r) => {
      const gate = step.startsWith('★')
      const tone = gate ? 'primary' : PHASE_TONE[(PHASE[step] ?? 'wait') as keyof typeof PHASE_TONE]
      return { id: `${c}-${r}`, at: [r + 1, c + 1], shape: 'pill', size: 'sm', title: step, tone, ...(gate ? { hl: true } : {}) }
    }),
  )
  const edges = lanes.flatMap(([, steps], c) => steps.slice(1).map((_, r) => ({ from: `${c}-${r}`, to: `${c}-${r + 1}`, a: 'b', b: 't' })))
  const groups = lanes.map(([label, steps], c) => ({ at: [1, c + 1, steps.length, c + 1], label, pad: 12 }))
  return figure({ type: 'graph', cols: 3, colGap: 40, rowGap: 14, nodes, edges, groups }, 'Three paths for one item, in the colours of the flow above. Each one ends at your accept.')
}

function deskDiagram(): string {
  return figure(
    {
      type: 'graph', cols: 3, colGap: 30, rowGap: 40,
      groups: [{ at: [1, 1, 2, 2], label: 'company/ · one ledger, one wiki for the tree', icon: 'folder', pad: 14 }],
      nodes: [
        { id: 'company', at: [1, 1], span: [1, 2], icon: 'folder', kicker: 'top desk', title: 'company/', tags: ['engineering', 'wiki'], tone: 'primary' },
        { id: 'shop', at: [2, 1], w: 200, icon: 'folder', kicker: 'child desk', title: 'shop/', tags: ['+ learn', '− wiki'], meta: 'packs here: engineering, learn' },
        { id: 'billing', at: [2, 2], w: 200, icon: 'folder', title: 'billing/', meta: 'no nook.yml · packs here: engineering, wiki', line: 'dashed' },
        { id: 'personal', at: [1, 3], span: [2, 1], w: 210, align: 'center', icon: 'folder', kicker: 'top desk', title: 'personal/', tags: ['engineering', 'wiki', 'learn'], meta: 'its own ledger, wiki and courses', tone: 'success' },
      ],
      edges: [
        { from: 'company', to: 'shop', label: 'packs flow down', split: true, a: 'b' },
        { from: 'company', to: 'billing', split: true, a: 'b' },
      ],
    },
    'Packs flow down. A child desk adds a pack or turns one off. The folder that holds both top desks is not a desk.',
  )
}

function learnLoopDiagram(): string {
  return figure(
    {
      type: 'graph', cols: 3, colGap: 70, rowGap: 56,
      nodes: [
        { id: 'cards', at: [1, 1], icon: 'card', title: 'Cards due', meta: 'about 3 minutes', tone: 'warning' },
        { id: 'lesson', at: [1, 2], icon: 'book', title: 'Lesson', meta: 'your top pattern', tone: 'warning' },
        { id: 'output', at: [1, 3], icon: 'pen', title: 'Your output', meta: 'one short task', tone: 'warning' },
        { id: 'deck', at: [2, 1], icon: 'file', title: 'cards/cards.md', meta: 'each new point becomes a card' },
        { id: 'mistakes', at: [2, 2], icon: 'file', title: 'mistakes.md', meta: 'your own words' },
      ],
      edges: [
        { from: 'cards', to: 'lesson' }, { from: 'lesson', to: 'output' },
        { from: 'deck', to: 'cards', label: 'due today' }, { from: 'mistakes', to: 'lesson', label: 'top pattern' },
        { from: 'output', to: 'mistakes', label: 'each mistake', a: 'b', b: 'r' },
      ],
    },
    'One day of a course. Your mistakes pick the lesson, and each new point comes back as a card.',
  )
}

function archDiagram(): string {
  const wide = (id: string, row: number, icon: string, title: string, meta: string, more: Spec = {}) =>
    ({ id, at: [row, 1], span: [1, 4], w: 460, icon, title, meta, ...more })
  const pack = (id: string, col: number, title: string, meta: string, tone: string) => ({ id, at: [4, col], title, meta, tone })
  const packs = ['core', 'eng', 'wiki', 'learn']
  return figure(
    {
      type: 'graph', cols: 4, colGap: 16, rowGap: 46,
      nodes: [
        wide('session', 1, 'bot', 'Claude Code session', 'the companion, its agents'),
        wide('plugins', 2, 'layers', 'plugins/<pack>/', 'skills, agents, hooks, templates — no code'),
        wide('app', 3, 'terminal', 'apps/nook', 'the one binary: joins the commands'),
        pack('core', 1, 'core', 'init, doctor, guards', 'neutral'), pack('eng', 2, 'engineering', 'ledger, machine, git', 'primary'),
        pack('wiki', 3, 'wiki', 'shelves, indexes', 'success'), pack('learn', 4, 'learn', 'courses, cards', 'warning'),
        wide('base', 5, 'box', 'shared · desk', 'CLI router, hook I/O, desks, nook.yml'),
        wide('disk', 6, 'folder', 'the desk on disk', 'nook.yml · .claude/ · .nook/engineering.db · works/ · docs/wiki/ · learn/', { fill: 'soft' }),
      ],
      edges: [
        { from: 'session', to: 'plugins', label: 'hooks, skills, agents' }, { from: 'plugins', to: 'app', label: 'bin/nook' },
        ...packs.map(p => ({ from: 'app', to: p, split: true })), ...packs.map(p => ({ from: p, to: 'base', merge: true })),
        { from: 'base', to: 'disk', label: 'reads and writes' },
      ],
    },
    'The layers. A pack package imports only <code>shared</code> and <code>desk</code>; a plugin holds no code.',
  )
}

/** A text block whose first line names a diagram becomes that diagram; any other ASCII tree becomes a Bench tree. `DRAWN` keeps each diagram in step with its doc text. */
function figureFor(text: string): string | null {
  if (text.startsWith('backlog ──/spec──▶')) return flowDiagram()
  if (text.startsWith('company/              a top desk')) return deskDiagram()
  if (text.startsWith('Claude Code session')) return archDiagram()
  if (/[├└]── /.test(text)) return figure(treeSpec(text))
  return null
}

function polish(html: string, links: LinkMap): string {
  return html
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_all, code: string) => figureFor(unesc(code)) ?? `<pre class="code"><code>${code}</code></pre>`)
    .replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (_all, lang: string, code: string) => `<pre class="code" data-lang="${lang}"><code>${code}</code></pre>`)
    .replace(/<blockquote>\s*<p>In short: ([\s\S]*?)<\/p>\s*<\/blockquote>/, (_all, text: string) =>
      `<div class="inshort card"><span class="label">In short</span><p>${text.charAt(0).toUpperCase()}${text.slice(1)}</p></div>`)
    // code in a table cell breaks only between its words, never at a hyphen inside one
    .replace(/<td>([\s\S]*?)<\/td>/g, (_all, cell: string) =>
      `<td>${cell.replace(/<code>([^<]*)<\/code>/g, (_c, text: string) => `<code>${text.split(' ').map(w => `<span class="nw">${w}</span>`).join(' ')}</code>`)}</td>`)
    .replace(/<table>/g, '<div class="tbl card"><div class="scroll-x" data-bn-scroll><table>')
    .replace(/<\/table>/g, '</table></div></div>')
    .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, (_all, href: string, text: string) =>
      /^https?:/.test(href) ? `<a href="${href}" target="_blank" rel="noopener">${text}</a>` : (links(href, text) ?? text))
    .replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_all, n: string, text: string) => `<h${n} id="${slug(text)}">${text}</h${n}>`)
}

const TABLE_END = '</table></div></div>'

function insertAfterTable(html: string, heading: string, figure: string): string {
  const at = html.indexOf(heading)
  const end = at < 0 ? -1 : html.indexOf(TABLE_END, at)
  if (end < 0) throw new Error(`no table after the heading ${heading}`)
  return html.slice(0, end + TABLE_END.length) + figure + html.slice(end + TABLE_END.length)
}

/** The rows of the first table after a `## heading` of a Markdown file, as plain cells. */
export function tableAfter(markdown: string, heading: string): string[][] {
  const start = markdown.indexOf(`\n## ${heading}\n`)
  if (start < 0) throw new Error(`report.md has no section ${heading}`)
  const lines = markdown.slice(start).split('\n').slice(2)
  const first = lines.findIndex(l => l.startsWith('|'))
  const rows: string[][] = []
  for (const line of lines.slice(first + 2)) {
    if (!line.startsWith('|')) break
    rows.push(line.slice(1, -1).split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|').replace(/`/g, '')))
  }
  return rows
}

type Source = { file: string; heading: string; kind: 'block' | 'table'; fingerprint: string }

/** The doc text that each hand-drawn diagram shows. When that text changes, the build stops until the diagram is redrawn. */
export const DRAWN: Record<string, Source> = {
  flowDiagram: { file: 'guide/04-work.md', heading: 'The flow', kind: 'block', fingerprint: 'f1b21a777f92' },
  pathsDiagram: { file: 'guide/04-work.md', heading: 'Pick a path', kind: 'table', fingerprint: '167c69b0cf6d' },
  deskDiagram: { file: 'guide/02-desks.md', heading: 'Nested desks', kind: 'block', fingerprint: '7a9853e7354a' },
  learnLoopDiagram: { file: 'guide/06-learn.md', heading: 'Each day', kind: 'table', fingerprint: '65e0a38b5168' },
  archDiagram: { file: 'report.md', heading: 'How it is built', kind: 'block', fingerprint: '267fdd1dbb2a' },
}

/** The first fenced block or table in the `## heading` section of a Markdown file, or null. */
export function sourceText(markdown: string, heading: string, kind: Source['kind']): string | null {
  const start = markdown.indexOf(`\n## ${heading}\n`)
  if (start < 0) return null
  const body = markdown.slice(start + heading.length + 5)
  const section = body.slice(0, body.search(/\n## |$/))
  const found = kind === 'block' ? section.match(/^```[^\n]*\n[\s\S]*?\n```$/m) : section.match(/^\|.*\|$(?:\n^\|.*\|$)+/m)
  return found?.[0] ?? null
}

export const fingerprint = (text: string) => new Bun.CryptoHasher('sha256').update(text).digest('hex').slice(0, 12)

/** One line for each diagram whose doc text changed since it was drawn. */
export function staleDiagrams(docs: string): string[] {
  return Object.entries(DRAWN).flatMap(([draw, source]) => {
    const text = sourceText(readFileSync(join(docs, source.file), 'utf8'), source.heading, source.kind)
    const now = text === null ? 'none' : fingerprint(text)
    if (now === source.fingerprint) return []
    const what = text === null ? `has no ${source.kind}` : `changed (fingerprint ${now})`
    return [`the ${source.kind} under "## ${source.heading}" of docs/${source.file} ${what}: redraw ${draw}() in scripts/pages/build.ts, then set its fingerprint in DRAWN to ${now}`]
  })
}

const firstNumber = (cell: string) => cell.match(/[\d,]+/)?.[0]?.replace(/,/g, '') ?? '?'

function statTiles(report: string): string {
  const shown: Record<string, string> = { packs: 'packs', commands: 'commands', skills: 'skills', agents: 'agents', hooks: 'hooks', tests: 'tests pass' }
  const tiles = tableAfter(report, 'At a glance')
    .filter(([part = '']) => part in shown)
    .map(([part = '', count = '', check = '']) =>
      `<div class="bn-stat"><span class="bn-stat__label">${shown[part]}</span><span class="bn-stat__value">${firstNumber(count)}</span><span class="bn-stat__foot"><code>${esc(check)}</code></span></div>`)
  return `<div class="tiles">${tiles.join('')}</div>`
}

function testBars(report: string): string {
  const rows = tableAfter(report, 'Tests')
    .filter(([name]) => name !== 'total')
    .map(([label = '', tests = '0']) => ({ label, value: Number(tests) }))
    .sort((a, b) => b.value - a.value)
  return figure({ type: 'chart', kind: 'bars', label: 'Tests for each package', rows }, 'Tests for each package. The table below holds the same numbers.')
}

type Shell = { title: string; eyebrow: string; heading: string; lead: string; meta: string[]; tabs: Tab[]; body: string }

function page(o: Shell): string {
  const css = readFileSync(join(HERE, 'page.css'), 'utf8')
  const js = readFileSync(join(HERE, 'page.js'), 'utf8')
  const kit = uiKit()
  return `<title>${o.title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${kit.css}\n${css}</style>
<header class="hero"><div class="col">
  <p class="eyebrow">${o.eyebrow}</p>
  <h1>${o.heading}</h1>
  <p class="hero-lead">${o.lead}</p>
  <p class="hero-meta">${o.meta.map(m => `<span>${m}</span>`).join('')}</p>
</div></header>
<div class="stick-sentinel" aria-hidden="true"></div>
<nav class="tabbar" aria-label="Sections"><div class="tabbar-in">${o.tabs.map(t => `<a class="tab" href="#${t.id}">${t.label}</a>`).join('')}</div></nav>
<main class="page">${o.body}</main>
<footer class="foot"><div class="col">Built from the Markdown files in <code>docs/</code> of the Nook repo. The files are the source; this page is a view of them.</div></footer>
<script>${kit.js}</script>\n<script>${js}</script>`
}

const dateText = (now: Date) => now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** Each image of a chapter, such as `![The inbox](images/inbox.png)`, as a figure that holds the file, so the page stays one file. */
function inlineImages(html: string, dir: string): string {
  return html.replace(/<p><img src="([^"]+)" alt="([^"]*)" \/><\/p>/g, (_all, src: string, alt: string) => {
    const data = readFileSync(join(dir, src)).toString('base64')
    return `<figure class="shot card"><img src="data:image/png;base64,${data}" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`
  })
}

function guidePage(docs: string, report: string, reportUrl: string, now: Date): string {
  const links: LinkMap = (href, text) => {
    const chapter = href.match(/^0(\d)-[\w-]+\.md(#.*)?$/)
    if (chapter) return `<a href="#ch-${chapter[1]}">${text}</a>`
    if (href === 'README.md') return `<a href="#ch-0">${text}</a>`
    if (href.startsWith('../report.md')) return reportUrl ? `<a href="${reportUrl}" target="_blank" rel="noopener">${text}</a>` : text
    const ref = href.match(/^\.\.\/reference\/([\w-]*\.md)?$/)
    return ref ? `${text} (<code>docs/reference/${ref[1] ?? ''}</code>)` : null
  }
  const tabs: Tab[] = []
  const sections = GUIDE_FILES.map((file, i) => {
    const source = readFileSync(join(docs, 'guide', file), 'utf8')
    const title = i === 0 ? 'About this book' : (source.match(/^# (.*)$/m)?.[1] ?? file).replace(/^\d+\.\s*/, '')
    let html = inlineImages(polish(md(source.replace(/^# .*\n/, '')), links), join(docs, 'guide'))
    if (file === '04-work.md') html = insertAfterTable(html, '<h2 id="pick-a-path">', pathsDiagram())
    if (file === '06-learn.md') html = insertAfterTable(html, '<h2 id="each-day">', learnLoopDiagram())
    tabs.push({ id: `ch-${i}`, label: i === 0 ? 'About' : `<span class="tab-n">${i}</span>${title}` })
    const head = i === 0
      ? `<h2 class="ch-title">${title}</h2>`
      : `<div class="ch-head"><span class="ch-num">${i}</span><div><p class="eyebrow">Chapter ${i}</p><h2 class="ch-title">${title}</h2></div></div>`
    return `<section class="chapter" id="ch-${i}">${head}${html}</section>`
  })
  const packs = tableAfter(report, 'At a glance').find(([part]) => part === 'packs')?.[1] ?? ''
  return page({
    title: 'Nook Guide Book',
    eyebrow: 'Nook · Guide book',
    heading: 'Work, learn and grow with Claude Code, on your own <mark>desk</mark>',
    lead: 'How to use Nook, one task for each chapter. Read chapter 1 first; read the others when you need them.',
    meta: [`As of ${dateText(now)}`, `${GUIDE_FILES.length - 1} chapters`, `${esc(packs)} packs`.replace(/^(\d+): (.*) packs$/, '$1 packs: $2')],
    tabs,
    body: sections.join(''),
  })
}

function reportPage(report: string, now: Date): string {
  let html = polish(md(report.replace(/^# .*\n/, '')), () => null).replace(/<p>This file states the build of today\.[\s\S]*?<\/p>/, '')
  html = html
    .replace('<h2 id="at-a-glance">At a glance</h2>', `<h2 id="at-a-glance">At a glance</h2>${statTiles(report)}`)
    .replace('<h2 id="tests">Tests</h2>', `<h2 id="tests">Tests</h2>${testBars(report)}`)
    .replace(/<td>(in daily use|in real use)([\s\S]*?)<\/td>/g, (_all, state: string, rest: string) => `<td><span class="chip tone-ok">${state}</span>${rest.replace(/^:\s*/, '<br>')}</td>`)
    .replace(/<td>built;([\s\S]*?)<\/td>/g, (_all, rest: string) => `<td><span class="chip">built</span><br>${rest.trim()}</td>`)
    .replace(/<td>planned<\/td>/g, '<td><span class="chip">planned</span></td>')
    .replace(/<td>planned, next<\/td>/g, '<td><span class="chip tone-ok">next</span></td>')
  const short: Record<string, string> = { 'The parts and their state': 'Parts', 'How it is built': 'Architecture' }
  const tabs: Tab[] = [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id = '', text = '']) => ({ id, label: short[stripTags(text)] ?? text }))
  const body = html
    .split(/(?=<h2 id=)/)
    .map(part => `<section class="chapter"${part.match(/^<h2 id="([^"]+)"/) ? ` id="${part.match(/^<h2 id="([^"]+)"/)![1]}"` : ''}>${part}</section>`)
    .join('')
  const tests = firstNumber(tableAfter(report, 'At a glance').find(([part]) => part === 'tests')?.[1] ?? '')
  return page({
    title: 'Nook Build Report',
    eyebrow: 'Nook · Build report',
    heading: 'What Nook is made of today',
    lead: 'The parts, the numbers, the limits and the next steps of the build.',
    meta: [`As of ${dateText(now)}`, `<mark>${tests} of ${tests} tests pass</mark>`, 'Every number names the command that checks it'],
    tabs,
    body,
  })
}

export function buildPages(docs: string, reportUrl = '', now = new Date()): Pages {
  const stale = staleDiagrams(docs)
  if (stale.length) throw new Error(stale.join('\n'))
  const report = readFileSync(join(docs, 'report.md'), 'utf8')
  return { guide: guidePage(docs, report, reportUrl, now), report: reportPage(report, now) }
}

if (import.meta.main) {
  const [out, reportUrl = ''] = process.argv.slice(2)
  if (!out) {
    console.error('usage: bun run pages <out dir> [the url of the published report]')
    process.exit(2)
  }
  const pages = buildPages(resolve(HERE, '../../docs'), reportUrl)
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'guide.html'), pages.guide)
  writeFileSync(join(out, 'report.html'), pages.report)
  console.log(`${join(out, 'guide.html')}\n${join(out, 'report.html')}`)
}
