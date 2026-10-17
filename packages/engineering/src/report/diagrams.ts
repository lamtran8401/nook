import { match } from 'ts-pattern'

/**
 * Diagrams with the Diagram components of the UI kit, drawn from the mermaid text of a document: a flowchart, a
 * sequence diagram, and the lanes of the slices. The nodes are HTML; the page script draws the edges between the
 * nodes where the browser placed them. A diagram of another kind returns null, and the viewer draws the mermaid.
 */

export type Tone = 'ink' | 'changes' | 'new' | 'danger'
export type FlowNode = { id: string; label: string; tone: Tone }
export type FlowEdge = { from: string; to: string; label: string; dashed: boolean }
export type Flowchart = { nodes: FlowNode[]; edges: FlowEdge[] }
export type SequenceStep =
  | { kind: 'call'; from: string; to: string; label: string; reply: boolean }
  | { kind: 'note'; from: string; to: string; label: string }
export type Sequence = { actors: { id: string; label: string }[]; steps: SequenceStep[] }
export type LaneSlice = { id: string; title: string; area: string; depends: string[]; acs?: number[]; size?: string | null }

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
const ARROW = /\s*(-->|-\.->|==>|---)\s*/

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
    // `a -->|"label"| b`, `a -- label --> b`, `a --> b`, `a -.-> b`, `a ==> b`: the split keeps each arrow between two parts
    const parts = line.split(ARROW)
    if (parts.length === 1) {
      if (!readNode(line, nodes)) return null
      continue
    }
    let from = readNode(parts[0]!.replace(/\s+--\s+.*$/, ''), nodes)
    const inline = /\s+--\s+(.*)$/.exec(parts[0]!)
    for (let i = 2; i < parts.length; i += 2) {
      const piece = parts[i]!
      const labelled = /^\|"?(.*?)"?\|\s*(.*)$/.exec(piece)
      const label = labelled ? labelled[1]! : i === 2 && inline ? inline[1]! : ''
      const to = readNode(labelled ? labelled[2]! : piece, nodes)
      if (!from || !to) return null
      edges.push({ from, to, label, dashed: parts[i - 1] === '-.->' })
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

// ---------- the layout ----------

/** The rows of a flowchart from top to bottom: each node one row under its lowest parent; an edge that closes a cycle does not count. */
export function flowLayers(chart: Flowchart): string[][] {
  const ids = chart.nodes.map(n => n.id)
  const out = new Map(ids.map(id => [id, chart.edges.filter(e => e.from === id).map(e => e.to)]))
  const back = new Set<string>()
  const state = new Map<string, 'open' | 'done'>()
  const visit = (id: string) => {
    state.set(id, 'open')
    for (const to of out.get(id) ?? []) {
      if (state.get(to) === 'open') back.add(`${id}>${to}`)
      else if (!state.has(to)) visit(to)
    }
    state.set(id, 'done')
  }
  ids.forEach(id => state.has(id) || visit(id))
  const forward = chart.edges.filter(e => !back.has(`${e.from}>${e.to}`))
  const rank = new Map(ids.map(id => [id, 0]))
  for (let pass = 0; pass < ids.length; pass++)
    for (const e of forward) rank.set(e.to, Math.max(rank.get(e.to)!, rank.get(e.from)! + 1))
  const rows: string[][] = []
  for (const id of ids) (rows[rank.get(id)!] ??= []).push(id)
  // order each row by the mean place of its parents, so few edges cross
  const place = new Map<string, number>()
  for (const [r, row] of rows.entries()) {
    if (!row) continue
    if (r > 0) {
      const mean = (id: string) => {
        const parents = forward.filter(e => e.to === id && place.has(e.from)).map(e => place.get(e.from)!)
        return parents.length ? parents.reduce((a, b) => a + b, 0) / parents.length : Number.POSITIVE_INFINITY
      }
      row.sort((a, b) => mean(a) - mean(b))
    }
    row.forEach((id, i) => place.set(id, (i + 0.5) / row.length))
  }
  return rows.filter(Boolean)
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

// ---------- the HTML ----------

const TONE_OF: Record<Tone, string> = { ink: '', changes: 'primary', new: 'success', danger: 'danger' }
const WORD_OF: Record<Tone, string> = { ink: '', changes: 'changes', new: 'new', danger: 'error' }

/** `web: the page` puts `web` in the kicker of the node. */
const splitLabel = (label: string): [string, string] => {
  const m = /^([\w./-]{1,16}):\s+(.+)$/.exec(label)
  return m ? [m[1]!, m[2]!] : ['', label]
}

type NodeRole = 'root' | 'leaf' | 'inner'

function flowNode(node: FlowNode, role: NodeRole): string {
  const [area, title] = splitLabel(node.label)
  const kicker = [area, WORD_OF[node.tone]].filter(Boolean).join(' · ')
  const attrs = match(node.tone)
    .with('changes', () => ' data-tone="primary" data-state="active"')
    .with('new', () => ' data-variant="soft" data-tone="success"')
    .with('danger', () => ' data-variant="soft" data-tone="danger"')
    .with('ink', () => (role === 'root' ? ' data-variant="root"' : role === 'leaf' && !kicker ? ' data-shape="pill"' : ''))
    .exhaustive()
  const kick = kicker ? `<span class="bn-node__kicker">${esc(kicker)}</span>` : ''
  return `<div class="bn-node" data-node="${esc(node.id)}"${attrs}>${kick}<span class="bn-node__title">${esc(title)}</span></div>`
}

type Edge = { from: string; to: string; label?: string; tone?: string; dashed?: boolean; main?: boolean }

/** The canvas of a diagram: its nodes, an empty SVG for the edges that the page script draws, and the edge labels. */
function canvas(kind: string, body: string, edges: Edge[], style = ''): string {
  const paths = edges
    .map((e, i) => {
      const cls = ['bn-edge', e.dashed ? 'bn-edge--dashed' : '', e.main ? 'kd-edge--main' : ''].filter(Boolean).join(' ')
      const tone = e.tone ? ` data-tone="${e.tone}"` : ''
      return `<path class="${cls}"${tone} data-edge="${i}" data-from="${esc(e.from)}" data-to="${esc(e.to)}"></path><path class="kd-head"${tone} data-head="${i}"></path>`
    })
    .join('')
  const labels = edges
    .map((e, i) => (e.label ? `<span class="kd-edge-label" data-label="${i}">${esc(e.label)}</span>` : ''))
    .join('')
  const css = style ? ` style="${style}"` : ''
  return `<div class="kd-dg__scroll"><div class="kd-dg__canvas kd-${kind}" data-kd-canvas${css}>${body}<svg class="kd-edges" aria-hidden="true">${paths}</svg>${labels}</div></div>`
}

function legend(tones: Tone[]): string {
  const words = (['changes', 'new', 'danger'] as Tone[]).filter(t => tones.includes(t))
  if (!words.length) return ''
  const items = [...words.map(t => `<span data-tone="${TONE_OF[t]}">${WORD_OF[t]}</span>`), '<span>stays as it is</span>']
  return `<figcaption class="bn-legend">${items.join('')}</figcaption>`
}

export function flowchartHtml(chart: Flowchart): string {
  const byId = new Map(chart.nodes.map(n => [n.id, n]))
  const hasIn = new Set(chart.edges.map(e => e.to))
  const hasOut = new Set(chart.edges.map(e => e.from))
  const role = (id: string): NodeRole => {
    if (!chart.edges.length) return 'inner'
    if (!hasIn.has(id)) return 'root'
    return hasOut.has(id) ? 'inner' : 'leaf'
  }
  const rows = flowLayers(chart)
    .map(row => `<div class="kd-layer">${row.map(id => flowNode(byId.get(id)!, role(id))).join('')}</div>`)
    .join('')
  const edges: Edge[] = chart.edges.map(e => {
    const tone = TONE_OF[byId.get(e.to)!.tone]
    return { from: e.from, to: e.to, label: e.label, dashed: e.dashed, tone: tone || undefined, main: Boolean(tone) }
  })
  return `<figure class="kd-dg">${canvas('flow', rows, edges)}${legend(chart.nodes.map(n => n.tone))}</figure>`
}

export function sequenceHtml(seq: Sequence): string {
  const col = new Map(seq.actors.map((a, i) => [a.id, i + 1]))
  const heads = seq.actors
    .map(
      (a, i) =>
        `<div class="kd-seq__actor" style="grid-column: ${i + 1}; grid-row: 1"><span class="bn-node" data-shape="pill"><span class="bn-node__title">${esc(a.label)}</span></span></div>`,
    )
    .join('')
  const rows = Math.max(1, seq.steps.length)
  const lifelines = seq.actors.map((_, i) => `<i class="kd-seq__life" style="grid-column: ${i + 1}; grid-row: 2 / span ${rows}"></i>`).join('')
  const steps = seq.steps
    .map((step, k) => {
      const a = col.get(step.from) ?? 1
      const b = col.get(step.to) ?? a
      const [lo, hi] = [Math.min(a, b), Math.max(a, b)]
      const place = `grid-column: ${lo} / ${hi + 1}; grid-row: ${k + 2}; --span: ${hi - lo + 1}`
      return match(step)
        .with(
          { kind: 'note' },
          s => `<div class="kd-seq__note" style="${place}"><span class="bn-node" data-variant="soft"><span class="bn-node__meta">${esc(s.label)}</span></span></div>`,
        )
        .with({ kind: 'call' }, s => {
          const way = a === b ? ' is-self' : b < a ? ' is-left' : ''
          return `<div class="kd-seq__call${s.reply ? ' is-reply' : ''}${way}" style="${place}"><span class="kd-seq__label">${esc(s.label)}</span><i class="kd-seq__line"></i></div>`
        })
        .exhaustive()
    })
    .join('')
  const grid = `<div class="kd-seq" style="--actors: ${seq.actors.length}">${heads}${lifelines}${steps}</div>`
  return `<figure class="kd-dg"><div class="kd-dg__scroll">${grid}</div><figcaption class="kd-dg__note">Solid line: a call. Dashed line: the answer.</figcaption></figure>`
}

/** The lanes of the slices: one group for each area, since one builder runs a lane, and the `depends` between them. */
export function lanesFigure(slices: LaneSlice[]): string {
  const areas = [...new Set(slices.map(s => s.area))]
  const rows = laneRows(slices)
  const height = Math.max(0, ...rows.values()) + 1
  const groups = areas
    .map(
      (area, i) =>
        `<div class="bn-group" style="grid-column: ${i + 1}; grid-row: 1 / -1"><span class="bn-group__label">${esc(area)}</span></div>`,
    )
    .join('')
  const cells = slices
    .map(s => {
      const kicker = [s.id, s.size ? `size ${s.size}` : ''].filter(Boolean).join(' · ')
      const meta = s.acs?.length ? `<span class="bn-node__meta">${s.acs.map(n => `AC${n}`).join(', ')}</span>` : ''
      const node = `<div class="bn-node" data-node="${esc(s.id)}"><span class="bn-node__kicker">${esc(kicker)}</span><span class="bn-node__title">${esc(s.title)}</span>${meta}</div>`
      return `<div class="kd-lanes__cell" style="grid-column: ${areas.indexOf(s.area) + 1}; grid-row: ${rows.get(s.id)! + 1}">${node}</div>`
    })
    .join('')
  const ids = new Set(slices.map(s => s.id))
  const edges: Edge[] = slices.flatMap(s => s.depends.filter(d => ids.has(d)).map(d => ({ from: d, to: s.id })))
  // the next slice of a lane waits for the builder, also with no `depends`
  for (const area of areas) {
    const lane = slices.filter(s => s.area === area)
    lane.slice(1).forEach((s, i) => {
      if (!edges.some(e => e.from === lane[i]!.id && e.to === s.id)) edges.push({ from: lane[i]!.id, to: s.id, dashed: true })
    })
  }
  const style = `grid-template-columns: repeat(${areas.length}, minmax(150px, 1fr)); grid-template-rows: repeat(${height}, auto) 16px`
  const note = '<figcaption class="kd-dg__note">One builder for each lane. Solid line: waits for that slice. Dashed line: next for the same builder.</figcaption>'
  return `<figure class="kd-dg">${canvas('lanes', groups + cells, edges, style)}${note}</figure>`
}

/** A mermaid text as a diagram of the UI kit, or null for a kind that Nook does not draw. */
export function renderDiagram(source: string): string | null {
  const chart = parseFlowchart(source)
  if (chart) return flowchartHtml(chart)
  const seq = parseSequence(source)
  return seq ? sequenceHtml(seq) : null
}
