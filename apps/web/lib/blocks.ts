import type { PhrasingContent, RootContent } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import type { DiagramSpec } from '@/components/diagram.tsx'
import { fenceDrawing, type Legend } from '@/lib/fences.ts'
import { type Inline, plainText } from '@/lib/inline.ts'
import { applyRules } from '@/lib/rules.ts'

export { type Inline, plainText }

/**
 * A document of a desk as a tree of blocks, one template for each kind. The `:::` blocks come from a line scan, so a
 * block knows its line; the Markdown between them and inside them comes from remark with GFM.
 */

export type PanelTone = 'info' | 'note' | 'success' | 'warning' | 'error'
export type Block =
  | { kind: 'heading'; depth: number; content: Inline }
  | { kind: 'paragraph'; content: Inline }
  | { kind: 'list'; ordered: boolean; start: number; items: Block[][] }
  | { kind: 'tasks'; items: { checked: boolean; blocks: Block[] }[] }
  | { kind: 'divider' }
  | { kind: 'table'; align: ('left' | 'right' | 'center' | null)[]; head: Inline[]; rows: Inline[][] }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'code'; lang: string | null; text: string }
  | { kind: 'diagram'; spec: DiagramSpec; legend?: Legend }
  | { kind: 'panel'; tone: PanelTone; blocks: Block[] }
  | { kind: 'decision'; blocks: Block[] }
  | { kind: 'expand'; title: string; blocks: Block[] }
  | { kind: 'columns'; columns: Block[][] }
  | { kind: 'unknown'; line: number; reason: string; text: string }
  | { kind: 'criteria'; items: { n: number; tag: string; content: Inline; refs: string[] }[] }
  | { kind: 'rules'; items: { label: string; content: Inline; sources: Source[] }[] }
  | { kind: 'pieces'; items: { title: string; content: Inline }[] }
  | { kind: 'steps'; items: { action: Inline; seen: Inline }[] }
  | { kind: 'outlist'; items: Inline[] }
  | { kind: 'numbered'; items: Inline[] }
  | { kind: 'headsup'; items: Inline[] }
  | { kind: 'met'; items: Inline[] }
  | { kind: 'callout'; tone: 'short' | 'know'; content: Inline }
  | { kind: 'none'; kinds: string[] }
  | { kind: 'task'; id: string; title: string; area: string; depends: string; size: string; rows: [string, Inline][] }
/** Where a rule or a criterion comes from, such as Q2, or G5 with its impact. */
export type Source = { text: string; level?: 'low' | 'med' | 'high' }
export type Doc = { meta: Record<string, string>; title: string; blocks: Block[] }
/**
 * `places` are words such as the areas of an item: before a colon in a flowchart node they become its kicker.
 * `links` gives the address of each `[[name]]` that the page links to, such as `/wiki/resources/orders-api.md`.
 */
export type DocOptions = { places?: string[]; links?: Record<string, string> }

const PANELS: readonly string[] = ['info', 'note', 'success', 'warning', 'error']
const OPEN = /^:::\s*([a-z][\w-]*)\s*(.*)$/
const CLOSE = /^:::\s*$/
const FENCE = /^\s*(```|~~~)/

const markdown = unified().use(remarkParse).use(remarkGfm)

type Segment =
  | { kind: 'markdown'; text: string; line: number }
  | { kind: 'directive'; name: string; arg: string; body: string; line: number; closed: boolean; raw: string }

/** The `:::` blocks and the Markdown between them; a `:::` inside a code fence is code, and a block may hold another. */
function segments(lines: string[], first: number): Segment[] {
  const out: Segment[] = []
  let text: string[] = []
  let textLine = first
  let fence: string | null = null
  const flush = () => {
    if (text.some(l => l.trim())) out.push({ kind: 'markdown', text: text.join('\n'), line: textLine })
    text = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const open = fence ? null : OPEN.exec(line)
    if (!open) {
      if (!text.length) textLine = first + i
      text.push(line)
      const mark = FENCE.exec(line)?.[1]
      if (mark) fence = fence === mark ? null : (fence ?? mark)
      continue
    }
    flush()
    const end = closingLine(lines, i)
    const closed = end < lines.length
    out.push({ kind: 'directive', name: open[1]!, arg: open[2]!.trim(), body: lines.slice(i + 1, end).join('\n'), line: first + i, closed, raw: lines.slice(i, closed ? end + 1 : end).join('\n') })
    i = end
  }
  flush()
  return out
}

/** The index of the `:::` that closes the block opened at `open`, or the length of `lines` when none does. */
function closingLine(lines: string[], open: number): number {
  let depth = 1
  let fence: string | null = null
  for (let j = open + 1; j < lines.length; j++) {
    const line = lines[j]!
    const mark = FENCE.exec(line)?.[1]
    if (mark) fence = fence === mark ? null : (fence ?? mark)
    if (fence || mark) continue
    if (OPEN.test(line)) depth++
    else if (CLOSE.test(line) && --depth === 0) return j
  }
  return lines.length
}

function blocksOf(text: string, first: number, options: DocOptions): Block[] {
  return segments(text.split('\n'), first).flatMap(segment =>
    segment.kind === 'markdown' ? markdownBlocks(segment.text, segment.line, options) : directiveBlocks(segment, options),
  )
}

function directiveBlocks(d: Extract<Segment, { kind: 'directive' }>, options: DocOptions): Block[] {
  const inner = () => blocksOf(d.body, d.line + 1, options)
  const block: Block = PANELS.includes(d.name)
    ? { kind: 'panel', tone: d.name as PanelTone, blocks: inner() }
    : d.name === 'decision'
      ? { kind: 'decision', blocks: inner() }
      : d.name === 'expand'
        ? { kind: 'expand', title: d.arg || 'More', blocks: inner() }
        : d.name === 'columns'
          ? { kind: 'columns', columns: splitOnDividers(inner()) }
          : { kind: 'unknown', line: d.line, reason: `no block is named ${d.name}`, text: d.raw }
  if (d.closed) return [block]
  return [block, { kind: 'unknown', line: d.line, reason: `the ::: of line ${d.line} has no closing :::`, text: d.raw }]
}

function splitOnDividers(blocks: Block[]): Block[][] {
  const columns: Block[][] = [[]]
  for (const block of blocks) {
    if (block.kind === 'divider') columns.push([])
    else columns.at(-1)!.push(block)
  }
  return columns
}

function markdownBlocks(text: string, first: number, options: DocOptions): Block[] {
  const tree = markdown.parse(text)
  if (options.links) linkNames(tree, options.links)
  return tree.children.flatMap(node => nodeBlocks(node, first - 1, options))
}

const WIKI_NAME = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g

/** Each `[[name]]` or `[[name|words]]` with a known address becomes a link; a name with none stays as it is written. */
function linkNames(node: { children?: unknown[] }, links: Record<string, string>): void {
  if (!node.children) return
  node.children = node.children.flatMap(child => {
    const text = child as { type: string; value?: string }
    if (text.type !== 'text' || !text.value?.includes('[[')) {
      linkNames(child as { children?: unknown[] }, links)
      return [child]
    }
    const parts: PhrasingContent[] = []
    let at = 0
    for (const m of text.value.matchAll(WIKI_NAME)) {
      const url = links[m[1]!.trim()]
      if (!url) continue
      if (m.index > at) parts.push({ type: 'text', value: text.value.slice(at, m.index) })
      parts.push({ type: 'link', url, children: [{ type: 'text', value: m[2]?.trim() ?? m[1]!.trim() }] })
      at = m.index + m[0].length
    }
    if (at < text.value.length) parts.push({ type: 'text', value: text.value.slice(at) })
    return parts
  })
}

/** One mdast node as blocks; `base` turns a line of the parsed text into a line of the file. */
function nodeBlocks(node: RootContent, base: number, options: DocOptions): Block[] {
  const line = base + (node.position?.start.line ?? 1)
  switch (node.type) {
    case 'heading':
      return [{ kind: 'heading', depth: node.depth, content: node.children }]
    case 'paragraph':
      return [{ kind: 'paragraph', content: node.children }]
    case 'thematicBreak':
      return [{ kind: 'divider' }]
    case 'blockquote':
      return [{ kind: 'quote', blocks: node.children.flatMap(child => nodeBlocks(child, base, options)) }]
    case 'list': {
      const items = node.children.map(item => ({ checked: item.checked, blocks: item.children.flatMap(child => nodeBlocks(child, base, options)) }))
      if (items.every(item => typeof item.checked === 'boolean')) return [{ kind: 'tasks', items: items.map(item => ({ checked: item.checked === true, blocks: item.blocks })) }]
      return [{ kind: 'list', ordered: node.ordered === true, start: node.start ?? 1, items: items.map(item => item.blocks) }]
    }
    case 'table': {
      const [head, ...rows] = node.children.map(row => row.children.map(cell => cell.children))
      return [{ kind: 'table', align: node.align ?? [], head: head ?? [], rows }]
    }
    case 'code':
      return [codeBlock(node.lang ?? null, node.value, line, options.places ?? [])]
    case 'html':
      // raw HTML never reaches the page: it shows as the text that the agent wrote
      return [{ kind: 'paragraph', content: [{ type: 'text', value: node.value }] }]
    default:
      return [{ kind: 'unknown', line, reason: `no template for a Markdown ${node.type}`, text: '' }]
  }
}

function codeBlock(lang: string | null, text: string, line: number, places: string[]): Block {
  const drawing = fenceDrawing(lang, text, places)
  if (drawing && 'error' in drawing) return { kind: 'unknown', line, reason: drawing.error, text: `\`\`\`${lang}\n${text}\n\`\`\`` }
  if (drawing) return { kind: 'diagram', spec: drawing.spec, ...(drawing.legend ? { legend: drawing.legend } : {}) }
  if (lang !== 'bench') return { kind: 'code', lang, text }
  try {
    return { kind: 'diagram', spec: JSON.parse(text) as DiagramSpec }
  } catch {
    return { kind: 'unknown', line, reason: 'the bench block is not valid JSON', text: `\`\`\`bench\n${text}\n\`\`\`` }
  }
}

function frontMatter(text: string): { meta: Record<string, string>; body: string; first: number } {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!match) return { meta: {}, body: text, first: 1 }
  const meta = Object.fromEntries(
    match[1]!
      .split('\n')
      .map(line => /^([\w-]+):\s*(.*)$/.exec(line))
      .filter(m => m !== null)
      .map(m => [m[1]!, m[2]!]),
  )
  return { meta, body: text.slice(match[0].length), first: match[0].split('\n').length }
}

export function parseDoc(text: string, options: DocOptions = {}): Doc {
  const { meta, body, first } = frontMatter(text)
  const blocks = blocksOf(body, first, options)
  const head = blocks[0]
  if (head?.kind === 'heading' && head.depth === 1) return { meta, title: plainText(head.content), blocks: applyRules(blocks.slice(1)) }
  return { meta, title: '', blocks: applyRules(blocks) }
}
