import { match } from 'ts-pattern'

import { bodyLines, FENCE } from '../documents/markdown.ts'
import { renderDiagram } from './diagrams.ts'

/** The Markdown of an item document as HTML in the Bench style; every text is escaped. */

export type PageDoc = 'spec' | 'plan' | 'tasks'

const TONES: Record<string, string> = { ADD: 'success', CHANGE: 'warning', REMOVE: 'danger', NONE: 'ink' }
const AC_LINE = /^\[(ADD|CHANGE|REMOVE|NONE)\]\s+(.*?)(?:\s+\(([^()]+)\))?$/
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
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const plain = (text: string) => escape(text.replace(/[`*]/g, ''))

/** A mermaid source as the block that the viewer draws. */
export const mermaidBlock = (source: string) =>
  `<div class="dg-wrap"><pre class="mermaid">${escape(themed(source.trim()))}</pre></div>`

/** A neutral theme until the UI kit sets the colours, at the real size of the diagram; a block with its own init keeps it. */
const themed = (source: string) => (source.startsWith('%%{init') ? source : `%%{init: {"theme": "neutral", "flowchart": {"useMaxWidth": false}, "sequence": {"useMaxWidth": false}, "mindmap": {"useMaxWidth": false}}}%%\n${source}`)

export function renderDocument(text: string, doc: PageDoc): string {
  return new Renderer(bodyLines(text), doc).render()
}

class Renderer {
  private i = 0
  private section = ''
  private open = false
  private readonly out: string[] = []

  constructor(
    private readonly lines: string[],
    private readonly doc: PageDoc,
  ) {}

  render(): string {
    while (this.i < this.lines.length) this.block(this.lines[this.i]!)
    this.close()
    return this.out.join('\n')
  }

  private block(line: string): void {
    const kind = this.kindOf(line)
    match(kind)
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

  private close(): void {
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
    this.out.push(language === 'mermaid' ? (renderDiagram(source) ?? mermaidBlock(source)) : `<pre class="source">${escape(source)}</pre>`)
  }

  private heading(line: string): void {
    this.i++
    const [, marks, text] = /^(#{1,6})\s+(.*)$/.exec(line)!
    if (marks!.length === 1) {
      this.out.push(`<h2 class="doc-title">${inline(text!)}</h2>`)
      return
    }
    if (marks!.length > 2) {
      this.out.push(`<h4>${inline(text!)}</h4>`)
      return
    }
    this.close()
    this.section = text!.trim().toLowerCase()
    this.out.push(`<section class="sec"><h3><span class="label">${inline(text!)}</span></h3>`)
    this.open = true
  }

  private quote(): void {
    const parts: string[] = []
    while (this.i < this.lines.length && this.lines[this.i]!.startsWith('>'))
      parts.push(this.lines[this.i++]!.replace(/^>\s?/, ''))
    const text = parts.join(' ')
    const short = /^In short:\s*/i.test(text)
    const label = short ? 'In short' : 'Note'
    this.out.push(
      `<div class="short"><span class="label">${label}</span><p>${inline(text.replace(/^In short:\s*/i, ''))}</p></div>`,
    )
  }

  private table(): void {
    const rows: string[][] = []
    while (this.i < this.lines.length && this.lines[this.i]!.trimStart().startsWith('|'))
      rows.push(cells(this.lines[this.i++]!))
    const [head = [], ...rest] = rows
    const body = rest.filter(row => !row.every(cell => /^:?-+:?$/.test(cell)))
    // a table of three columns or more becomes one card for each row on a phone
    const stack = head.length >= 3 ? ' stack' : ''
    const headHtml = head.map(cell => `<th>${inline(cell)}</th>`).join('')
    const bodyHtml = body
      .map(
        row =>
          `<tr>${row.map((cell, k) => `<td data-label="${plain(head[k] ?? '')}"${k === 0 ? ' class="k"' : ''}><span class="cell">${inline(cell)}</span></td>`).join('')}</tr>`,
      )
      .join('')
    this.out.push(
      `<div class="table-wrap${stack}"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`,
    )
  }

  private list(): void {
    const ordered = /^\d+\.\s/.test(this.lines[this.i]!.trimStart())
    const items: string[] = []
    while (this.i < this.lines.length && LIST_ITEM.test(this.lines[this.i]!.trimStart()))
      items.push(this.lines[this.i++]!.trimStart().replace(LIST_ITEM, ''))
    if (this.section === 'acceptance criteria') {
      this.out.push(`<ol class="acs">${items.map((item, n) => criterionRow(item, n + 1)).join('')}</ol>`)
      return
    }
    const tag = ordered ? 'ol' : 'ul'
    this.out.push(`<${tag} class="facts">${items.map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`)
  }

  private paragraph(): void {
    const parts = [this.lines[this.i++]!.trim()]
    while (this.i < this.lines.length) {
      const line = this.lines[this.i]!
      if (!line.trim() || FENCE.test(line) || BLOCK_START.test(line.trimStart())) break
      parts.push(line.trim())
      this.i++
    }
    this.out.push(`<p>${inline(parts.join(' '))}</p>`)
  }

  /** `## T<n>: title` and its `- key: value` lines as one slice card. */
  private slice(): void {
    this.close()
    const [, id, title] = SLICE_HEADING.exec(this.lines[this.i++]!)!
    const fields = new Map<string, string>()
    while (this.i < this.lines.length && !/^##?\s/.test(this.lines[this.i]!)) {
      const field = SLICE_FIELD.exec(this.lines[this.i++]!.trim())
      if (field) fields.set(field[1]!.toLowerCase(), field[2]!.trim())
    }
    const depends = fields.get('depends') ?? ''
    const chips = [
      `<span class="chip area">${escape(fields.get('area') ?? 'no area')}</span>`,
      `<span class="chip">size ${escape(fields.get('size') ?? '?')}</span>`,
      `<span class="chip">${/^(none|-)?$/i.test(depends) ? 'starts first' : `after ${escape(depends)}`}</span>`,
    ]
    const rows = [
      ['Criteria', 'acs'],
      ['Files', 'files'],
      ['Done when', 'done when'],
      ['Proof', 'proof'],
    ]
      .filter(([, key]) => fields.get(key!))
      .map(([label, key]) => `<dt>${label}</dt><dd>${inline(fields.get(key!)!)}</dd>`)
      .join('')
    this.out.push(
      `<article class="slice"><header><span class="tid">${escape(id!)}</span><h4>${inline(title!)}</h4></header><div class="chips">${chips.join('')}</div><dl>${rows}</dl></article>`,
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
  const found = AC_LINE.exec(item)
  if (!found) return `<li><span class="ac-n">AC${n}</span><span></span><span class="ac-t">${inline(item)}</span></li>`
  const [, tag, text, source] = found
  const from = source ? ` <span class="src">${escape(source)}</span>` : ''
  return `<li><span class="ac-n">AC${n}</span><span class="tag tone-${TONES[tag!]}">${tag}</span><span class="ac-t">${inline(text!)}${from}</span></li>`
}
