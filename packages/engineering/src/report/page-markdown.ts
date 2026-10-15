import { match } from 'ts-pattern'

import { bodyLines, FENCE } from '../documents/markdown.ts'
import { renderDiagram } from './diagrams.ts'

/** The Markdown of an item document as HTML with the components of the UI kit; every text is escaped. */

export type PageDoc = 'spec' | 'plan' | 'tasks' | 'walkthrough'

const TONES: Record<string, string> = { ADD: 'success', CHANGE: 'warning', REMOVE: 'danger', NONE: 'neutral' }
/** A quote that starts with one of these labels becomes an alert of its tone; any other quote is a neutral Note. */
const CALLOUTS: { label: string; tone: string; icon: string }[] = [
  { label: 'In short', tone: 'primary', icon: 'info' },
  { label: 'Need to know', tone: 'warning', icon: 'alert' },
]
const NOTE = { label: 'Note', tone: 'neutral', icon: 'quote' }
const AC_LINE =/^\[(ADD|CHANGE|REMOVE|NONE)\]\s+(.*?)(?:\s+\(([^()]+)\))?$/
const SLICE_HEADING = /^##\s+(T\d+)\s*:\s*(.*?)\s*$/
const SLICE_FIELD = /^[-*]\s+([A-Za-z][A-Za-z ]*?)\s*:\s*(.*)$/
const LIST_ITEM = /^(?:[-*]|\d+\.)\s+/
const BLOCK_START = /^(#{1,6}\s|>|\||[-*]\s|\d+\.\s)/

export const escape = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const inline = (text: string) =>
  escape(text)
    .replace(/`([^`]+)`/g, '<code class="bn-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const plain = (text: string) => escape(text.replace(/[`*]/g, ''))

/** A mermaid source as the block that the viewer draws. */
export const mermaidBlock = (source: string) =>
  `<figure class="kd-dg"><div class="kd-dg__scroll"><pre class="mermaid">${escape(themed(source.trim()))}</pre></div></figure>`

/** A neutral theme at the real size of the diagram; a block with its own init keeps it. */
const themed = (source: string) =>
  source.startsWith('%%{init')
    ? source
    : `%%{init: {"theme": "neutral", "flowchart": {"useMaxWidth": false}, "sequence": {"useMaxWidth": false}}}%%\n${source}`

/** The text of the first `# ` heading: the page shows it above the document. */
export function docTitle(text: string): string | null {
  const line = bodyLines(text).find(l => /^#\s/.test(l))
  return line ? line.replace(/^#\s+/, '').trim() : null
}

/** `extra` goes right after the In short block, or first when the document has none. */
export function renderDocument(text: string, doc: PageDoc, extra = ''): string {
  return new Renderer(bodyLines(text), doc, extra).render()
}

/** Text blocks go in one prose block, slice cards in one list; any other block ends the run. */
type Run = 'prose' | 'slices'

class Renderer {
  private i = 0
  private section = ''
  private open = false
  private run: { kind: Run; parts: string[] } | null = null
  private readonly out: string[] = []

  constructor(
    private readonly lines: string[],
    private readonly doc: PageDoc,
    private extra: string,
  ) {}

  render(): string {
    while (this.i < this.lines.length) this.block(this.lines[this.i]!)
    this.close()
    if (this.extra) this.out.unshift(this.extra)
    return this.out.join('\n')
  }

  private block(line: string): void {
    match(this.kindOf(line))
      .with('blank', () => this.i++)
      .with('fence', () => this.fence())
      .with('slice', () => this.slice())
      .with('heading', () => this.heading(line))
      .with('quote', () => this.quote())
      .with('table', () => this.table())
      .with('list', () => this.list())
      .with('paragraph', () => this.paragraph())
      .exhaustive()
  }

  private kindOf(line: string) {
    if (!line.trim()) return 'blank' as const
    if (FENCE.test(line)) return 'fence' as const
    if (this.doc === 'tasks' && SLICE_HEADING.test(line)) return 'slice' as const
    if (/^#{1,6}\s/.test(line)) return 'heading' as const
    if (line.startsWith('>')) return 'quote' as const
    if (line.trimStart().startsWith('|')) return 'table' as const
    if (LIST_ITEM.test(line.trimStart())) return 'list' as const
    return 'paragraph' as const
  }

  private push(html: string, kind?: Run): void {
    if (this.run && this.run.kind !== kind) this.flush()
    if (!kind) {
      this.out.push(html)
      return
    }
    this.run ??= { kind, parts: [] }
    this.run.parts.push(html)
  }

  private flush(): void {
    if (!this.run) return
    const css = this.run.kind === 'prose' ? 'bn-prose' : 'kd-slices'
    this.out.push(`<div class="${css}">${this.run.parts.join('')}</div>`)
    this.run = null
  }

  private close(): void {
    this.flush()
    if (this.open) this.out.push('</section>')
    this.open = false
  }

  private fence(): void {
    const language = this.lines[this.i]!.replace(FENCE, '').trim()
    const body: string[] = []
    this.i++
    while (this.i < this.lines.length && !FENCE.test(this.lines[this.i]!)) body.push(this.lines[this.i++]!)
    this.i++
    const source = body.join('\n')
    if (language === 'mermaid') {
      this.push(renderDiagram(source) ?? mermaidBlock(source))
      return
    }
    this.push(`<div class="bn-code"><pre>${body.map(l => `<span class="ln">${escape(l)}</span>`).join('')}</pre></div>`)
  }

  private heading(line: string): void {
    this.i++
    const [, marks, text] = /^(#{1,6})\s+(.*)$/.exec(line)!
    if (marks!.length === 1) return
    if (marks!.length > 2) {
      this.push(`<h3>${inline(text!)}</h3>`, 'prose')
      return
    }
    this.close()
    this.section = text!.trim().toLowerCase()
    this.out.push(`<section class="kd-sec"><h2 class="kd-sec__title">${inline(text!)}</h2>`)
    this.open = true
  }

  private quote(): void {
    const parts: string[] = []
    while (this.i < this.lines.length && this.lines[this.i]!.startsWith('>'))
      parts.push(this.lines[this.i++]!.replace(/^>\s?/, ''))
    const text = parts.join(' ')
    const callout = CALLOUTS.find(c => text.toLowerCase().startsWith(`${c.label.toLowerCase()}:`))
    const { label, tone, icon } = callout ?? NOTE
    const body = callout ? text.slice(label.length + 1).trim() : text
    this.push(
      `<div class="bn-alert" data-tone="${tone}"><span class="bn-alert__icon"><span data-bn-icon="${icon}"></span></span><div><p class="bn-alert__label">${label}</p><p class="bn-alert__body">${inline(body)}</p></div></div>`,
    )
    if (label === 'In short' && this.extra) {
      this.push(this.extra)
      this.extra = ''
    }
  }

  private table(): void {
    const rows: string[][] = []
    while (this.i < this.lines.length && this.lines[this.i]!.trimStart().startsWith('|'))
      rows.push(cells(this.lines[this.i++]!))
    const [head = [], ...rest] = rows
    const body = rest.filter(row => !row.every(cell => /^:?-+:?$/.test(cell)))
    // a table of three columns or more becomes one block for each row on a phone
    const stack = head.length >= 3 ? ' kd-stack' : ''
    const headHtml = head.map(cell => `<th>${inline(cell)}</th>`).join('')
    const bodyHtml = body
      .map(row => `<tr>${row.map((cell, k) => `<td data-label="${plain(head[k] ?? '')}">${inline(cell)}</td>`).join('')}</tr>`)
      .join('')
    this.push(`<div class="bn-table-wrap${stack}"><table class="bn-table"><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`)
  }

  private list(): void {
    const ordered = /^\d+\.\s/.test(this.lines[this.i]!.trimStart())
    const items: string[] = []
    while (this.i < this.lines.length && LIST_ITEM.test(this.lines[this.i]!.trimStart()))
      items.push(this.lines[this.i++]!.trimStart().replace(LIST_ITEM, ''))
    if (this.section === 'acceptance criteria') {
      this.push(`<ul class="bn-list kd-acs">${items.map((item, n) => criterionRow(item, n + 1)).join('')}</ul>`)
      return
    }
    const tag = ordered ? 'ol' : 'ul'
    this.push(`<${tag}>${items.map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`, 'prose')
  }

  private paragraph(): void {
    const parts = [this.lines[this.i++]!.trim()]
    while (this.i < this.lines.length) {
      const line = this.lines[this.i]!
      if (!line.trim() || FENCE.test(line) || BLOCK_START.test(line.trimStart())) break
      parts.push(line.trim())
      this.i++
    }
    this.push(`<p>${inline(parts.join(' '))}</p>`, 'prose')
  }

  /** `## T<n>: title` and its `- key: value` lines as one slice card. */
  private slice(): void {
    // consecutive slices share one list, so only an open section ends here
    if (this.open) this.close()
    const [, id, title] = SLICE_HEADING.exec(this.lines[this.i++]!)!
    const fields = new Map<string, string>()
    while (this.i < this.lines.length && !/^##?\s/.test(this.lines[this.i]!)) {
      const field = SLICE_FIELD.exec(this.lines[this.i++]!.trim())
      if (field) fields.set(field[1]!.toLowerCase(), field[2]!.trim())
    }
    const depends = fields.get('depends') ?? ''
    const first = /^(none|-)?$/i.test(depends)
    const eyebrow = [id!, fields.get('area') ?? 'no area', `size ${fields.get('size') ?? '?'}`].map(escape).join(' · ')
    const rows = [
      ['Criteria', 'acs'],
      ['Files', 'files'],
      ['Done when', 'done when'],
      ['Proof', 'proof'],
    ]
      .filter(([, key]) => fields.get(key!))
      .map(([label, key]) => `<dt>${label}</dt><dd>${inline(fields.get(key!)!)}</dd>`)
      .join('')
    const badge = first
      ? '<span class="bn-badge" data-tone="success" data-size="sm">starts first</span>'
      : `<span class="bn-badge" data-size="sm">after ${escape(depends)}</span>`
    this.push(
      `<article class="bn-card"><span class="bn-card__eyebrow">${eyebrow}</span><h3 class="bn-card__title">${inline(title!)}</h3><dl class="bn-dl">${rows}</dl><div class="bn-card__foot">${badge}</div></article>`,
      'slices',
    )
  }
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => cell.trim())

function criterionRow(item: string, n: number): string {
  const number = `<span class="bn-list__icon">AC${n}</span>`
  const found = AC_LINE.exec(item)
  if (!found) return `<li class="bn-list__item">${number}<span class="bn-list__main">${inline(item)}</span></li>`
  const [, tag, text, source] = found
  const from = source ? `<span class="kd-ac-src">${escape(source)}</span>` : ''
  const tags = `<span class="kd-ac-tags"><span class="bn-badge" data-tone="${TONES[tag!]}" data-size="sm">${tag}</span>${from}</span>`
  return `<li class="bn-list__item">${number}<span class="bn-list__main">${tags}<span>${inline(text!)}</span></span></li>`
}
