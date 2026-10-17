import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * The two pages of the docs, the guide book and the build report, built from the Markdown of `docs/`.
 * The Markdown is the source; a page is a view of it. The numbers of the report come from the tables of `report.md`.
 */

export type Pages = { guide: string; report: string }
type Tab = { id: string; label: string }
type Edge = [from: string, to: string, label?: string, kind?: 'u' | 'n', depth?: number]
type LinkMap = (href: string, text: string) => string | null

const HERE = import.meta.dir
const GUIDE_FILES = ['README.md', '01-start.md', '02-desks.md', '03-day.md', '04-work.md', '05-wiki.md', '06-learn.md', '07-blocks.md']
const PACK_TONE: Record<string, string> = { core: 'core', engineering: 'eng', wiki: 'wiki', learn: 'learn' }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const stripTags = (s: string) => unesc(s.replace(/<[^>]+>/g, '')).trim()
const md = (text: string) => Bun.markdown.html(text)

const chip = (text: string, tone = '', extra = '') => `<span class="chip ${tone ? `tone-${tone}` : ''} ${extra}">${text}</span>`
const packChip = (name: string, prefix = '') => chip(prefix + name, PACK_TONE[name] ?? '')

const ICON_FOLDER = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.5h5A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z"/></svg>'
const ICON_FILE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2h4.6L12 4.9v7.6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 12.5v-9A1.5 1.5 0 0 1 4.5 2z"/></svg>'
const CHEVRON = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5"/></svg>'

/** An ASCII tree (├── └── │) as a folder tree. A row is a name, two spaces or more, then a note. */
export function tree(text: string): string {
  const rows = text.replace(/\n$/, '').split('\n').map(line => {
    const [, indent = '', branch, rest = ''] = line.match(/^((?:│   |    )*)(├── |└── )?(.*)$/) ?? []
    const [name = '', ...note] = rest.split(/\s{2,}/)
    return { depth: (branch ? 1 : 0) + [...indent].length / 4, name: name.trim(), note: note.join(' ').trim() }
  })
  const html = rows.map((row, i) => {
    const hasKids = (rows[i + 1]?.depth ?? -1) > row.depth
    const folder = row.name.endsWith('/') || hasKids
    const icons = `${hasKids ? CHEVRON : '<span class="chev-gap"></span>'}${folder ? ICON_FOLDER : ICON_FILE}`
    const note = row.note ? `<span class="tree-note">${esc(row.note)}</span>` : ''
    return `<div class="tree-row" style="--d:${row.depth}"><span class="tree-ic">${icons}</span><code class="tree-name${folder ? ' is-folder' : ''}">${esc(row.name)}</code>${note}</div>`
  })
  return `<figure class="tree card">${html.join('')}</figure>`
}

const node = (id: string, title: string, caption = '', cls = '', style = '') =>
  `<div class="dg-node shape ${cls}" data-id="${id}" style="${style}"><span class="dg-title">${title}</span>${caption ? `<span class="dg-cap">${caption}</span>` : ''}</div>`
const diagram = (cls: string, inner: string, edges: Edge[], caption: string) =>
  `<figure class="fig"><div class="scroll-x"><div class="dg ${cls}" data-edges='${JSON.stringify(edges)}'><svg class="dg-edges" aria-hidden="true"></svg>${inner}</div></div><figcaption>${caption}</figcaption></figure>`

function flowDiagram(): string {
  const states: [string, string, string, number, number][] = [
    ['backlog', '/intake', 'tone-core', 1, 1], ['framing', '/spec', 'tone-plan', 2, 1], ['planning', '/recipe', 'tone-plan', 3, 1], ['ready', 'approved', 'tone-plan', 4, 1],
    ['cooking', '/cook', 'tone-build', 2, 2], ['review', '/deep-review', 'tone-check', 3, 2], ['done', '/close', 'tone-done', 4, 2],
  ]
  const inner = states.map(([s, cap, tone, c, r]) => node(s, s, cap, tone, `grid-column:${c};grid-row:${r}`)).join('')
  const legend = [['tone-core', 'waiting'], ['tone-plan', 'frame and plan'], ['tone-build', 'build'], ['tone-check', 'check'], ['tone-done', 'done']]
    .map(([tone, text]) => `<span class="legend-item"><span class="legend-dot chip ${tone}"></span>${text}</span>`)
    .join('')
  const edges: Edge[] = [
    ['backlog', 'framing', 'start'], ['framing', 'planning', 'agree'], ['planning', 'ready', '★ approve'],
    ['ready', 'cooking', 'begin'], ['cooking', 'review', 'submit'], ['review', 'done', '★ accept'],
    ['ready', 'planning', 'replan', 'n', 34], ['review', 'cooking', 'reject', 'u', 36], ['done', 'cooking', 'reopen', 'u', 80],
  ]
  return diagram('dg-flow', inner, edges, `<span class="legend">${legend}</span>The states of an item. ★ marks a gate: only you take it, with <code>/gate</code>. Under each state: the command that works on it.`)
}

function pathsDiagram(): string {
  const PHASE: Record<string, string> = {
    '/intake': 'core', '/spec': 'plan', '/recipe': 'plan', 'one criterion': 'plan', spec: 'plan', plan: 'plan', proceed: 'plan',
    '/cook': 'build', '/quick': 'build', 'test first': 'build', build: 'build',
    '/deep-review': 'check', proof: 'check', review: 'check', '/guesses': 'check', '/close': 'done', '/auto': 'core',
  }
  const step = (s: string) => `<span class="step shape${s.startsWith('★') ? ' is-gate' : ` tone-${PHASE[s] ?? 'core'}`}">${s}</span>`
  const lane = (title: string, note: string, steps: string[]) =>
    `<div class="lane frame"><div class="frame-title">${title}<span class="frame-note">${note}</span></div><div class="lane-row">${steps.map(step).join('<span class="arr" aria-hidden="true"></span>')}</div></div>`
  const lanes = [
    lane('Full', 'a feature, two areas, a contract', ['/intake', '/spec', '/recipe', '★ approve', '/cook', '/deep-review', '★ accept', '/close']),
    lane('Quick', 'one area, size S, low risk', ['/quick', 'one criterion', 'test first', 'proof', '★ accept', '/close']),
    lane('Auto', 'the companion runs it alone', ['/auto', 'spec', 'plan', 'proceed', 'build', 'review', '★ accept', '/guesses']),
  ]
  return `<figure class="fig"><div class="scroll-x"><div class="lanes">${lanes.join('')}</div></div><figcaption>Three paths for one item, in the colours of the flow above. Each one ends at your accept.</figcaption></figure>`
}

function deskDiagram(): string {
  const packs = (names: string[]) => `<div class="chips">${names.map(n => packChip(n)).join('')}</div>`
  const title = (name: string, kind: string) => `<div class="frame-title"><code>${name}</code>${chip(kind, '', 'chip-quiet')}</div>`
  return `<figure class="fig"><div class="desks">
  <div class="desk-top frame">${title('company/', 'top desk')}${packs(['engineering', 'wiki'])}
    <div class="desk-kids">
      <div class="frame desk-child">${title('shop/', 'child desk')}<div class="chips">${packChip('learn', '+ ')}${chip('− wiki', '', 'off')}</div><p class="desk-note">Packs here: engineering, learn.</p></div>
      <div class="shape desk-folder"><span class="dg-title"><code>billing/</code></span><span class="dg-cap">no nook.yml</span><p class="desk-note">Packs here: engineering, wiki.</p></div>
    </div>
    <p class="desk-record">The record of each pack stays at <code>company/</code>: one ledger, one wiki for the tree.</p>
  </div>
  <div class="desk-top frame">${title('personal/', 'top desk')}${packs(['engineering', 'wiki', 'learn'])}<p class="desk-record">Its own ledger, wiki and courses. Nothing crosses to <code>company/</code>.</p></div>
</div><figcaption>Packs flow down. A child desk adds a pack or turns one off. The folder that holds both top desks is not a desk.</figcaption></figure>`
}

function learnLoopDiagram(): string {
  const inner = [
    node('cards', 'Cards due', 'about 3 minutes', 'tone-learn', 'grid-column:1;grid-row:1'),
    node('lesson', 'Lesson', 'your top pattern', 'tone-learn', 'grid-column:2;grid-row:1'),
    node('output', 'Your output', 'one short task', 'tone-learn', 'grid-column:3;grid-row:1'),
    node('deck', '<code>cards/cards.md</code>', 'boxes 1 to 5', 'is-file', 'grid-column:1;grid-row:2'),
    node('mistakes', '<code>mistakes.md</code>', 'your own words', 'is-file', 'grid-column:2;grid-row:2'),
  ].join('')
  const edges: Edge[] = [
    ['cards', 'lesson'], ['lesson', 'output'], ['deck', 'cards', 'due today'], ['mistakes', 'lesson', 'top pattern'],
    ['output', 'mistakes', 'each mistake'], ['output', 'deck', 'each new point', 'u', 40],
  ]
  return diagram('dg-loop', inner, edges, 'One day of a course. Your mistakes pick the lesson, and each new point comes back as a card.')
}

function archDiagram(): string {
  const wide = (id: string, title: string, cap: string, row: number, cls = '') => node(id, title, cap, `dg-wide ${cls}`, `grid-column:1 / -1;grid-row:${row}`)
  const pack = (id: string, title: string, cap: string, col: number) => node(id, title, cap, `tone-${PACK_TONE[title]}`, `grid-column:${col};grid-row:4`)
  const inner = [
    wide('session', 'Claude Code session', 'the companion, its agents', 1),
    wide('plugins', '<code>plugins/&lt;pack&gt;/</code>', 'skills, agents, hooks, templates — no code', 2),
    wide('app', '<code>apps/nook</code>', 'the one binary: joins the commands', 3),
    pack('core', 'core', 'init, doctor, guards', 1), pack('eng', 'engineering', 'ledger, machine, git', 2),
    pack('wiki', 'wiki', 'shelves, indexes', 3), pack('learn', 'learn', 'courses, cards', 4),
    wide('base', '<code>shared</code> · <code>desk</code>', 'CLI router, hook I/O, desks, nook.yml', 5),
    wide('disk', 'the desk on disk', 'nook.yml · .claude/ · .nook/engineering.db · work/ · docs/wiki/ · learn/', 6, 'is-file'),
  ].join('')
  const packs = ['core', 'eng', 'wiki', 'learn']
  const edges: Edge[] = [
    ['session', 'plugins', 'hooks, skills, agents'], ['plugins', 'app', 'bin/nook'],
    ...packs.map((p): Edge => ['app', p]), ...packs.map((p): Edge => [p, 'base']), ['base', 'disk', 'reads and writes'],
  ]
  return diagram('dg-arch', inner, edges, 'The layers. A pack package imports only <code>shared</code> and <code>desk</code>; a plugin holds no code.')
}

/** A text block whose first line names a diagram becomes that diagram; any other ASCII tree becomes a folder tree. `DRAWN` keeps each diagram in step with its doc text. */
function figureFor(text: string): string | null {
  if (text.startsWith('backlog ──/spec──▶')) return flowDiagram()
  if (text.startsWith('company/              a top desk')) return deskDiagram()
  if (text.startsWith('Claude Code session')) return archDiagram()
  if (/[├└]── /.test(text)) return tree(text)
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
    .replace(/<table>/g, '<div class="tbl card"><div class="scroll-x"><table>')
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
  pathsDiagram: { file: 'guide/04-work.md', heading: 'Pick a path', kind: 'table', fingerprint: '37d3812a5536' },
  deskDiagram: { file: 'guide/02-desks.md', heading: 'Nested desks', kind: 'block', fingerprint: '7a9853e7354a' },
  learnLoopDiagram: { file: 'guide/06-learn.md', heading: 'Each day', kind: 'table', fingerprint: '65e0a38b5168' },
  archDiagram: { file: 'report.md', heading: 'How it is built', kind: 'block', fingerprint: 'b9e1176fd8a3' },
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
    .map(([part = '', count = '', check = '']) => `<div class="tile card"><span class="tile-n">${firstNumber(count)}</span><span class="tile-l">${shown[part]}</span><code class="tile-c">${esc(check)}</code></div>`)
  return `<div class="tiles">${tiles.join('')}</div>`
}

function testBars(report: string): string {
  const rows = tableAfter(report, 'Tests')
    .filter(([name]) => name !== 'total')
    .map(([name = '', tests = '0', files = '0']) => ({ name, tests: Number(tests), files: Number(files) }))
    .sort((a, b) => b.tests - a.tests)
  const max = Math.max(...rows.map(r => r.tests))
  const bars = rows.map(r =>
    `<div class="bar-row" tabindex="0"><span class="bar-name">${r.name}</span><span class="bar-track"><span class="bar" style="width:${(r.tests / max) * 100}%"></span></span><span class="bar-val">${r.tests}</span><span class="bar-tip" role="tooltip">${r.name}: ${r.tests} tests in ${r.files} file${r.files === 1 ? '' : 's'}</span></div>`)
  const label = rows.map(r => `${r.name} ${r.tests}`).join(', ')
  return `<figure class="fig"><div class="bars card" role="img" aria-label="Tests for each package: ${label}">${bars.join('')}</div><figcaption>Tests for each package. The table below holds the same numbers.</figcaption></figure>`
}

type Shell = { title: string; eyebrow: string; heading: string; lead: string; meta: string[]; tabs: Tab[]; body: string }

function page(o: Shell): string {
  const css = readFileSync(join(HERE, 'page.css'), 'utf8')
  const js = readFileSync(join(HERE, 'page.js'), 'utf8')
  return `<title>${o.title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style>
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
<script>${js}</script>`
}

const dateText = (now: Date) => now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

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
    let html = polish(md(source.replace(/^# .*\n/, '')), links)
    if (file === '04-work.md') html = insertAfterTable(html, '<h2 id="pick-a-path">', pathsDiagram())
    if (file === '06-learn.md') html = insertAfterTable(html, '<h2 id="each-day">', learnLoopDiagram())
    tabs.push({ id: `ch-${i}`, label: i === 0 ? 'About' : `<span class="tab-n">${i}</span>${title}` })
    const head = i === 0
      ? `<h2 class="ch-title">${title}</h2>`
      : `<div class="ch-head"><span class="ch-num shape">${i}</span><div><p class="eyebrow">Chapter ${i}</p><h2 class="ch-title">${title}</h2></div></div>`
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
