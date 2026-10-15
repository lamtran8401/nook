import { match } from 'ts-pattern'

/**
 * Diagrams in the style of the UI kit, drawn from the mermaid text of a document: a flowchart, a sequence
 * diagram, and the lanes of the slices. A diagram of another kind returns null, and the viewer draws the mermaid.
 */

export type Tone = 'ink' | 'changes' | 'new' | 'danger'
export type FlowNode = { id: string; label: string; tone: Tone }
export type FlowEdge = { from: string; to: string; label: string }
export type Flowchart = { nodes: FlowNode[]; edges: FlowEdge[] }
export type SequenceStep =
  | { kind: 'call'; from: string; to: string; label: string; reply: boolean }
  | { kind: 'note'; from: string; to: string; label: string }
export type Sequence = { actors: { id: string; label: string }[]; steps: SequenceStep[] }
export type LaneSlice = { id: string; title: string; area: string; depends: string[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------- reading the mermaid text ----------

const MARKERS: [RegExp, Tone][] = [
  [/\s*\((?:new)\)\s*$/i, 'new'],
  [/\s*\((?:changes|changed)\)\s*$/i, 'changes'],
  [/\s*\((?:error)\)\s*$/i, 'danger'],
]
const CLASS_TONES: Record<string, Tone> = { new: 'new', changes: 'changes', primary: 'changes', danger: 'danger', error: 'danger', ink: 'ink' }

/** One node reference: `id`, `id["label"]`, `id[label]`, `id("label")`, with an optional `:::class`. */
const NODE = /^([A-Za-z_][\w-]*)\s*(?:(?:\[|\(|\{)\s*"?(.*?)"?\s*(?:\]|\)|\}))?\s*(?::::(\w+))?$/

function readNode(text: string, nodes: Map<string, FlowNode>): string | null {
  const m = NODE.exec(text.trim())
  if (!m) return null
  const id = m[1]!
  const known = nodes.get(id)
  if (m[2] === undefined && known) {
    if (m[3]) known.tone = CLASS_TONES[m[3]] ?? known.tone
    return id
  }
  let label = (m[2] ?? id).replace(/\\"/g, '"')
  let tone: Tone = (m[3] && CLASS_TONES[m[3]]) || 'ink'
  for (const [marker, markerTone] of MARKERS) {
    if (marker.test(label)) {
      label = label.replace(marker, '')
      tone = markerTone
    }
  }
  if (known && m[2] === undefined) return id
  nodes.set(id, { id, label, tone })
  return id
}

/** A flowchart of any direction, or null when the text holds a shape that this reader does not know. */
export function parseFlowchart(source: string): Flowchart | null {
  const lines = source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  if (!/^(?:flowchart|graph)\b/.test(lines[0] ?? '')) return null
  const nodes = new Map<string, FlowNode>()
  const edges: FlowEdge[] = []
  for (const line of lines.slice(1)) {
    if (/^(?:classDef|class|style|linkStyle|subgraph|end|direction|click)\b/.test(line)) continue
    // `a -->|"label"| b`, `a -- label --> b`, `a --> b`, `a -.-> b`, `a ==> b`
    const parts = line.split(/\s*(?:-->|-\.->|==>|---)\s*/)
    if (parts.length === 1) {
      if (!readNode(line, nodes)) return null
      continue
    }
    let from = readNode(parts[0]!.replace(/\s+--\s+.*$/, ''), nodes)
    const inline = /\s+--\s+(.*)$/.exec(parts[0]!)
    for (let i = 1; i < parts.length; i++) {
      const piece = parts[i]!
      const labelled = /^\|"?(.*?)"?\|\s*(.*)$/.exec(piece)
      const label = labelled ? labelled[1]! : i === 1 && inline ? inline[1]! : ''
      const to = readNode(labelled ? labelled[2]! : piece, nodes)
      if (!from || !to) return null
      edges.push({ from, to, label })
      from = to
    }
  }
  return nodes.size ? { nodes: [...nodes.values()], edges } : null
}

/** A sequence diagram: participants, calls, answers and notes. */
export function parseSequence(source: string): Sequence | null {
  const lines = source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  if (lines[0] !== 'sequenceDiagram') return null
  const actors: { id: string; label: string }[] = []
  const actor = (id: string, label = id) => {
    if (!actors.some(a => a.id === id)) actors.push({ id, label })
  }
  const steps: SequenceStep[] = []
  for (const line of lines.slice(1)) {
    const p = /^(?:participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/.exec(line)
    if (p) {
      actor(p[1]!, p[2]?.trim())
      continue
    }
    const note = /^Note\s+(?:over|right of|left of)\s+([^,:]+?)(?:\s*,\s*([^:]+?))?\s*:\s*(.*)$/i.exec(line)
    if (note) {
      steps.push({ kind: 'note', from: note[1]!, to: note[2] ?? note[1]!, label: note[3]! })
      continue
    }
    const call = /^(\S+?)\s*(-->>|->>|-->|->|--x|-x)\s*(\S+?)\s*:\s*(.*)$/.exec(line)
    if (!call) return null
    actor(call[1]!)
    actor(call[3]!)
    steps.push({ kind: 'call', from: call[1]!, to: call[3]!, label: call[4]!, reply: call[2]!.startsWith('--') })
  }
  return actors.length ? { actors, steps } : null
}

// ---------- drawing ----------

function wrap(text: string, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines
}
const tspans = (lines: string[], x: number, y: number, lh: number) =>
  lines.map((l, i) => `<tspan x="${x}" y="${y + i * lh}">${esc(l)}</tspan>`).join('')
const arrowHead = (id: string) =>
  `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="head"/></marker></defs>`
const boxClass = (tone: Tone) =>
  match(tone)
    .with('ink', () => 'solid')
    .with('changes', () => 'solid-primary')
    .with('new', () => 'dash-new')
    .with('danger', () => 'solid-danger')
    .exhaustive()

/** The row of each node: after every node that points to it; a node that only points down sits just above its target. */
function rowsOf(chart: Flowchart): FlowNode[][] {
  const incoming = new Map(chart.nodes.map(n => [n.id, chart.edges.filter(e => e.to === n.id).map(e => e.from)]))
  const depth = new Map<string, number>()
  const visit = (id: string, path: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!
    if (path.has(id)) return 0
    path.add(id)
    const d = Math.max(0, ...incoming.get(id)!.map(f => visit(f, path) + 1))
    path.delete(id)
    depth.set(id, d)
    return d
  }
  chart.nodes.forEach(n => visit(n.id, new Set()))
  chart.nodes.slice(1).forEach(n => {
    if (incoming.get(n.id)!.length) return
    const targets = chart.edges.filter(e => e.from === n.id).map(e => depth.get(e.to)!)
    if (targets.length) depth.set(n.id, Math.max(0, Math.min(...targets) - 1))
  })
  const rows: FlowNode[][] = []
  for (const n of chart.nodes) (rows[depth.get(n.id)!] ??= []).push(n)
  return rows.filter(Boolean)
}

export function flowchartSvg(chart: Flowchart, key: string): string {
  const rows = rowsOf(chart)
  const widest = Math.max(...rows.map(r => r.length))
  const W = Math.max(360, widest * 128 + 24)
  const gap = 16, gapY = 58, pad = 12, lh = 16
  const at = new Map<string, { x: number; y: number; w: number; h: number }>()
  const boxes: string[] = []
  let y = pad
  for (const row of rows) {
    const bw = row.length === 1 ? 260 : row.length === 2 ? 160 : Math.floor((W - 2 * pad - gap * (row.length - 1)) / row.length)
    const chars = Math.max(12, Math.floor(bw / 7.6))
    const h = Math.max(46, ...row.map(n => 18 + wrap(n.label, chars).length * lh))
    let x = (W - (row.length * bw + (row.length - 1) * gap)) / 2
    for (const n of row) {
      const lines = wrap(n.label, chars)
      at.set(n.id, { x, y, w: bw, h })
      boxes.push(`<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="12" class="${boxClass(n.tone)}"/>`)
      const ty = y + h / 2 - ((lines.length - 1) * lh) / 2 + 5
      boxes.push(`<text text-anchor="middle" font-size="13"${n.tone === 'changes' ? ' class="t-bold"' : ''}>${tspans(lines, x + bw / 2, ty, lh)}</text>`)
      x += bw + gap
    }
    y += h + gapY
  }
  const H = y - gapY + pad
  const lines: string[] = []
  const labels: string[] = []
  for (const e of chart.edges) {
    const a = at.get(e.from)!, b = at.get(e.to)!
    const [x1, y1, x2, y2] =
      b.y > a.y ? [a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y] : b.y < a.y ? [a.x + a.w / 2, a.y, b.x + b.w / 2, b.y + b.h] : [a.x + (b.x > a.x ? a.w : 0), a.y + a.h / 2, b.x + (b.x > a.x ? 0 : b.w), b.y + b.h / 2]
    lines.push(`<path d="M${x1} ${y1} L${x2} ${y2 + (y2 > y1 ? -2 : y2 < y1 ? 2 : 0)}" class="line" marker-end="url(#ah-${key})"/>`)
    if (!e.label) continue
    // the middle of a straight line, nearer the target on a diagonal down, nearer the source going up
    const t = x1 === x2 ? 0.5 : y2 > y1 ? 0.6 : 0.3
    const mx = x1 + (x2 - x1) * t, my = y1 + (y2 - y1) * t
    const ll = wrap(e.label, 26)
    const lw = Math.max(...ll.map(l => l.length)) * 6.6 + 12
    labels.push(`<rect x="${mx - lw / 2}" y="${my - 9 - (ll.length - 1) * 7}" width="${lw}" height="${18 + (ll.length - 1) * 14}" rx="6" class="edge-label"/>`)
    labels.push(`<text text-anchor="middle" font-size="11.5" class="t-mono t-muted">${tspans(ll, mx, my + 4 - (ll.length - 1) * 7, 14)}</text>`)
  }
  return `<svg class="dg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(key)}">${arrowHead(`ah-${key}`)}${lines.join('')}${boxes.join('')}${labels.join('')}</svg>`
}

export function sequenceSvg(seq: Sequence, key: string): string {
  const colW = 118, pad = 14, top = 54
  const W = pad * 2 + seq.actors.length * colW
  const cx = new Map(seq.actors.map((a, i) => [a.id, pad + i * colW + colW / 2]))
  const span = (s: SequenceStep) => Math.abs(cx.get(s.to)! - cx.get(s.from)!)
  const labelLines = (s: SequenceStep) =>
    s.kind === 'note' ? wrap(s.label, Math.floor((span(s) + 104) / 7)) : wrap(s.label, Math.max(14, Math.floor(span(s) / 6.6)))
  const ys: number[] = []
  let y = top
  for (const s of seq.steps) {
    y += 22 + labelLines(s).length * 13 + (s.kind === 'note' ? 6 : 0)
    ys.push(y)
  }
  const H = y + 26
  const parts: string[] = []
  for (const a of seq.actors) {
    const x = cx.get(a.id)!
    parts.push(`<line x1="${x}" y1="${top - 8}" x2="${x}" y2="${H - 8}" class="lifeline"/>`)
    parts.push(`<rect x="${x - 50}" y="10" width="100" height="32" rx="10" class="solid"/>`)
    parts.push(`<text x="${x}" y="31" text-anchor="middle" font-size="12.5" class="t-bold">${esc(a.label)}</text>`)
  }
  seq.steps.forEach((s, i) => {
    const sy = ys[i]!
    const ll = labelLines(s)
    if (s.kind === 'note') {
      const x1 = Math.min(cx.get(s.from)!, cx.get(s.to)!) - 52, x2 = Math.max(cx.get(s.from)!, cx.get(s.to)!) + 52
      parts.push(`<rect x="${x1}" y="${sy - 24}" width="${x2 - x1}" height="${12 + ll.length * 14}" rx="8" class="note"/>`)
      parts.push(`<text text-anchor="middle" font-size="11.5">${tspans(ll, (x1 + x2) / 2, sy - 10, 14)}</text>`)
      return
    }
    const x1 = cx.get(s.from)!, x2 = cx.get(s.to)!
    parts.push(`<path d="M${x1} ${sy} L${x2 + (x2 > x1 ? -3 : 3)} ${sy}" class="${s.reply ? 'line-reply' : 'line'}" marker-end="url(#ah-${key})"/>`)
    parts.push(`<text text-anchor="middle" font-size="11.5" class="t-mono${s.reply ? ' t-muted' : ''}">${tspans(ll, (x1 + x2) / 2, sy - 8 - (ll.length - 1) * 13, 13)}</text>`)
  })
  return `<svg class="dg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(key)}">${arrowHead(`ah-${key}`)}${parts.join('')}</svg>`
}

/** The row of each slice: after its dependencies, and after the slice before it in its lane, since one builder runs a lane. */
export function laneRows(slices: LaneSlice[]): Map<string, number> {
  const ids = new Set(slices.map(s => s.id))
  const lanes = new Map<string, LaneSlice[]>()
  for (const s of slices) (lanes.get(s.area) ?? lanes.set(s.area, []).get(s.area)!).push(s)
  const row = new Map<string, number>()
  const rowOf = (s: LaneSlice, path: Set<string>): number => {
    if (row.has(s.id)) return row.get(s.id)!
    if (path.has(s.id)) return 0
    path.add(s.id)
    const lane = lanes.get(s.area)!
    const before = lane[lane.indexOf(s) - 1]
    const deps = s.depends.filter(d => ids.has(d)).map(d => rowOf(slices.find(x => x.id === d)!, path) + 1)
    const r = Math.max(0, ...deps, before ? rowOf(before, path) + 1 : 0)
    row.set(s.id, r)
    return r
  }
  slices.forEach(s => rowOf(s, new Set()))
  return row
}

export function lanesSvg(slices: LaneSlice[], key: string): string {
  const areas = [...new Set(slices.map(s => s.area))]
  const row = laneRows(slices)
  const laneW = 168, gap = 14, rowH = 78, top = 40, pad = 10
  const W = pad * 2 + areas.length * laneW + (areas.length - 1) * gap
  const H = top + (Math.max(0, ...row.values()) + 1) * rowH + pad
  const pos = new Map(slices.map(s => [s.id, { x: pad + areas.indexOf(s.area) * (laneW + gap) + 10, y: top + row.get(s.id)! * rowH + 4, w: laneW - 20, h: 52 }]))
  const bands = areas.map((area, i) => {
    const x = pad + i * (laneW + gap)
    return `<rect x="${x}" y="4" width="${laneW}" height="${H - 8}" rx="14" class="band"/><text x="${x + 14}" y="26" font-size="11.5" class="t-mono t-muted">${esc(area.toUpperCase())} · ONE BUILDER</text>`
  })
  const lines: string[] = []
  for (const s of slices) {
    for (const d of s.depends.filter(id => pos.has(id))) {
      const a = pos.get(d)!, b = pos.get(s.id)!
      const from = slices.find(x => x.id === d)!
      if (from.area === s.area && row.get(s.id)! - row.get(d)! > 1) {
        // a dependency that skips a row runs on the side rail of the lane, not behind the slices
        lines.push(`<path d="M${a.x + a.w} ${a.y + a.h / 2} H${a.x + a.w + 5} V${b.y + b.h / 2} H${b.x + b.w + 2}" class="line" marker-end="url(#ah-${key})"/>`)
      } else if (from.area === s.area) {
        lines.push(`<path d="M${a.x + a.w / 2} ${a.y + a.h} L${b.x + b.w / 2} ${b.y - 2}" class="line" marker-end="url(#ah-${key})"/>`)
      } else {
        const right = b.x > a.x
        const x1 = a.x + (right ? a.w : 0), y1 = a.y + a.h / 2, x2 = b.x + (right ? 0 : b.w), y2 = b.y + b.h / 2
        lines.push(`<path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2 + (right ? -2 : 2)} ${y2}" class="line" marker-end="url(#ah-${key})"/>`)
      }
    }
  }
  for (const area of areas) {
    const lane = slices.filter(s => s.area === area)
    lane.forEach((s, k) => {
      const before = lane[k - 1]
      if (!before || s.depends.includes(before.id)) return
      const a = pos.get(before.id)!, b = pos.get(s.id)!
      lines.push(`<path d="M${a.x + a.w / 2} ${a.y + a.h} L${b.x + b.w / 2} ${b.y - 2}" class="line-queue"/>`)
    })
  }
  const cards = slices.map(s => {
    const { x, y, w, h } = pos.get(s.id)!
    const all = wrap(s.title, 14)
    const tl = all.length > 2 ? [all[0]!, `${all[1]!}…`] : all
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" class="solid"/><rect x="${x + 10}" y="${y + 10}" width="30" height="18" rx="5" class="gate-chip"/><text x="${x + 25}" y="${y + 23}" text-anchor="middle" font-size="11" class="t-mono t-bold t-on-accent">${esc(s.id)}</text><text font-size="12">${tspans(tl, x + 48, y + 23, 15)}</text>`
  })
  return `<svg class="dg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(key)}">${arrowHead(`ah-${key}`)}${bands.join('')}${lines.join('')}${cards.join('')}</svg>`
}

// ---------- the block on the page ----------

const TONE_LEGEND: Record<Tone, string> = {
  ink: '<span class="lg"><i class="l-solid"></i>stays</span>',
  changes: '<span class="lg"><i class="l-primary"></i>changes</span>',
  new: '<span class="lg"><i class="l-dash"></i>new</span>',
  danger: '<span class="lg"><i class="l-danger"></i>an error answer</span>',
}
const figure = (svg: string, legend: string, wide = false) =>
  `<figure class="dg-block"><div class="dg-wrap${wide ? ' seq' : ''}">${svg}</div><figcaption class="legend">${legend}</figcaption></figure>`

let counter = 0

/** The diagram of a mermaid text in the style of the UI kit, or null when the reader does not know its kind. */
export function renderDiagram(source: string): string | null {
  const key = `dg${++counter}`
  const chart = parseFlowchart(source)
  if (chart) {
    const used = (['ink', 'changes', 'new', 'danger'] as Tone[]).filter(t => chart.nodes.some(n => n.tone === t))
    return figure(flowchartSvg(chart, key), used.map(t => TONE_LEGEND[t]).join(''))
  }
  const seq = parseSequence(source)
  if (seq) return figure(sequenceSvg(seq, key), '<span class="lg"><i class="l-line"></i>a call</span><span class="lg"><i class="l-reply"></i>an answer</span>', true)
  return null
}

export function lanesFigure(slices: LaneSlice[]): string {
  return figure(lanesSvg(slices, `lanes${++counter}`), '<span class="lg"><i class="l-line"></i>depends on</span><span class="lg"><i class="l-queue"></i>waits for the same builder</span>')
}
