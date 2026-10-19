import type { DiagramSpec } from '@/components/diagram.tsx'

/**
 * The code fences that draw: a mermaid flowchart, sequenceDiagram or erDiagram, and a `tree` of files. A flowchart gives
 * structure only, nodes and edges with no places, since the Bench library lays out a graph.
 */

export type Legend = [tone: string, label: string][]
export type FenceDrawing = { spec: DiagramSpec; legend?: Legend } | { error: string }

// the role of a node gives its colour; the legend names each role that a drawing uses
const ROLES = {
  start: { fill: 'ink', legend: ['ink', 'start'] },
  new: { tone: 'success', fill: 'soft', legend: ['success', 'new'] },
  changes: { tone: 'primary', legend: ['primary', 'changes'] },
  error: { tone: 'danger', fill: 'soft', legend: ['danger', 'error'] },
  stays: { tone: 'neutral', legend: ['neutral', 'stays as it is'] },
} as const
type Role = keyof typeof ROLES
const TAG = /\s*\((new|error|changes[^)]*)\)\s*$/

/** The drawing of a fence, null for a fence that does not draw. `places` are words such as the areas of an item. */
export function fenceDrawing(lang: string | null, text: string, places: string[]): FenceDrawing | null {
  if (lang === 'tree') return { spec: treeSpec(text) }
  if (lang !== 'mermaid') return null
  const kind = text.trim().split(/\s+/)[0] ?? ''
  if (kind === 'flowchart' || kind === 'graph') return flowchart(text, places)
  if (kind === 'sequenceDiagram') return { spec: sequenceSpec(text) }
  if (kind === 'erDiagram') return { spec: erSpec(text) }
  return { error: `a mermaid ${kind} is not drawn yet` }
}

function flowchart(text: string, places: string[]): FenceDrawing {
  const nodes = new Map<string, { id: string; label: string }>()
  const edges: { from: string; to: string; label?: string }[] = []
  const groups: { label: string; nodes: string[] }[] = []
  let group: { label: string; nodes: string[] } | null = null
  for (const line of text.split('\n').slice(1)) {
    const sub = /^\s*subgraph\s+(\w+)(?:\[(?:"([^"]*)"|([^\]]*))\])?\s*$/.exec(line)
    if (sub) {
      group = { label: (sub[2] ?? sub[3] ?? sub[1]!).trim(), nodes: [] }
      groups.push(group)
      continue
    }
    if (/^\s*end\s*$/.test(line)) {
      group = null
      continue
    }
    // a node is A["text"] or A[text]; it joins the group that names it first
    for (const m of line.matchAll(/(\w+)\[(?:"([^"]*)"|([^\]"]*))\]/g)) {
      if (nodes.has(m[1]!)) continue
      nodes.set(m[1]!, { id: m[1]!, label: (m[2] ?? m[3]!).trim() })
      group?.nodes.push(m[1]!)
    }
    const edge = /^\s*(\w+)(?:\[[^\]]*\])?\s*-->(?:\|"?([^|"]*)"?\|)?\s*(\w+)/.exec(line)
    if (edge) edges.push({ from: edge[1]!, to: edge[3]!, ...(edge[2] ? { label: edge[2] } : {}) })
  }
  const roles: Role[] = []
  const specNodes = [...nodes.values()].map(node => {
    const tag = TAG.exec(node.label)?.[1] ?? ''
    const role: Role = tag === 'new' ? 'new' : tag.startsWith('changes') ? 'changes' : tag === 'error' ? 'error' : edges.some(e => e.to === node.id) ? 'stays' : 'start'
    roles.push(role)
    const words = node.label.replace(TAG, '')
    // "web: the page asks for …": an area before a colon is the kicker
    const colon = words.indexOf(': ')
    const place = colon > 0 && places.includes(words.slice(0, colon)) ? words.slice(0, colon) : ''
    const kicker = [place, tag ? tag.replace(/^changes:?\s*/, 'changes · ').replace(/ · $/, '').trim() : ''].filter(Boolean).join(' · ')
    const { legend: _legend, ...look } = ROLES[role]
    return { id: node.id, title: place ? words.slice(colon + 2) : words, ...(kicker ? { kicker } : {}), ...look }
  })
  const legend = (Object.keys(ROLES) as Role[]).filter(role => roles.includes(role)).map(role => [...ROLES[role].legend] as [string, string])
  return { spec: { type: 'graph', nodes: specNodes, edges, ...(groups.length ? { groups } : {}) }, legend }
}

// a part takes the icon and the tone of the first word of its label that names a kind of part
const PARTS: [RegExp, string, string][] = [
  [/owner|user|person/i, 'user', 'neutral'],
  [/browser|page|client/i, 'monitor', 'primary'],
  [/cli|terminal|nook/i, 'terminal', 'warning'],
  [/ledger|db|database|store/i, 'database', 'success'],
  [/web|app|api|server|service/i, 'server', 'primary'],
]

function sequenceSpec(text: string): DiagramSpec {
  const parts: { id: string; label: string; icon: string; tone: string }[] = []
  const steps: object[] = []
  for (const line of text.split('\n').slice(1)) {
    const part = /^\s*participant (\w+)(?: as (.+))?$/.exec(line)
    if (part) {
      const label = (part[2] ?? part[1]!).trim()
      const [, icon = 'box', tone = 'neutral'] = PARTS.find(([pattern]) => pattern.test(label)) ?? []
      parts.push({ id: part[1]!, label, icon, tone })
      continue
    }
    const note = /^\s*Note over ([\w, ]+):\s*(.+)$/.exec(line)
    if (note) {
      steps.push({ note: note[2], over: note[1]!.split(',').map(id => id.trim()) })
      continue
    }
    const call = /^\s*(\w+)(--?>>)(\w+):\s*(.+)$/.exec(line)
    if (call) steps.push({ from: call[1], to: call[3], label: call[4], ...(call[2] === '-->>' ? { reply: 1 } : {}) })
  }
  return { type: 'sequence', parts, steps }
}

// `||` one, `|o` zero or one, `}|` one or many, `}o` zero or many; the right side reads mirrored
const MARK: Record<string, string> = { '||': 'one-one', '|o': 'zero-one', 'o|': 'zero-one', '}|': 'one-many', '|{': 'one-many', '}o': 'zero-many', 'o{': 'zero-many' }

/** One table node for each entity, on a square grid in the order of a walk of the relations, so related tables sit side by side. */
function erSpec(text: string): DiagramSpec {
  type Row = { type: string; name: string; key?: string }
  const entities = new Map<string, Row[]>()
  const links: { a: string; b: string; start: string; end: string }[] = []
  const entity = (id: string) => entities.get(id) ?? entities.set(id, []).get(id)!
  let open: Row[] | null = null
  for (const raw of text.split('\n').slice(1)) {
    const line = raw.trim()
    if (open) {
      if (line === '}') open = null
      else {
        const [type = '', name = '', key] = line.split(/\s+/)
        if (name) open.push({ type, name, ...(key === 'PK' || key === 'FK' ? { key } : {}) })
      }
      continue
    }
    const block = /^(\w+)\s*\{$/.exec(line)
    if (block) {
      open = entity(block[1]!)
      continue
    }
    const rel = /^(\w+)\s+([|}o]{2})--([|{o]{2})\s+(\w+)/.exec(line)
    if (rel) {
      entity(rel[1]!)
      entity(rel[4]!)
      links.push({ a: rel[1]!, b: rel[4]!, start: MARK[rel[2]!] ?? 'one-one', end: MARK[rel[3]!] ?? 'zero-many' })
    }
  }
  const order: string[] = []
  const visit = (id: string) => {
    if (order.includes(id)) return
    order.push(id)
    for (const link of links) if (link.a === id || link.b === id) visit(link.a === id ? link.b : link.a)
  }
  for (const id of entities.keys()) visit(id)
  const cols = Math.ceil(Math.sqrt(order.length))
  const lower = (id: string) => id.toLowerCase()
  const nodes = order.map((id, i) => ({ id: lower(id), at: [Math.floor(i / cols) + 1, (i % cols) + 1], shape: 'table', icon: 'database', title: lower(id), rows: entities.get(id)! }))
  // a line joins the key of one table to the row of the other that names it, such as order.id to payment.order_id
  const edges = links.map(link => {
    const from = entities.get(link.a)!
    const to = entities.get(link.b)!
    const key = from.find(r => r.key === 'PK')?.name ?? from[0]?.name ?? 'id'
    const fk = to.find(r => r.name === `${lower(link.a)}_id`)?.name ?? to.find(r => r.key === 'FK')?.name ?? to[0]?.name ?? 'id'
    return { from: `${lower(link.a)}.${key}`, to: `${lower(link.b)}.${fk}`, start: link.start, end: link.end }
  })
  return { type: 'graph', cols, colGap: 84, rowGap: 40, pad: '12px 46px', nodes, edges }
}

// the chip of each state, a letter as git writes it, with the word as its tooltip
const FILE_STATE: Record<string, { text: string; tone: string }> = { new: { text: 'A', tone: 'success' }, changed: { text: 'M', tone: 'warning' }, deleted: { text: 'D', tone: 'danger' }, moved: { text: 'R', tone: 'primary' } }

/** A ```tree fence, drawn as a filetree: two spaces of indent for each level; a line is `name  state  note`, the state and the note optional. */
function treeSpec(text: string): DiagramSpec {
  type Entry = { name: string; children: Entry[]; badge?: { text: string; tone: string; title: string }; note?: string }
  const root: Entry[] = []
  const stack: { depth: number; children: Entry[] }[] = [{ depth: -1, children: root }]
  for (const line of text.replace(/\n$/, '').split('\n')) {
    const depth = (/^ */.exec(line)?.[0].length ?? 0) / 2
    const [name = '', state = '', ...rest] = line.trim().split(/\s{2,}/)
    const entry: Entry = { name, children: [] }
    const chip = FILE_STATE[state]
    const words = chip ? rest : [state, ...rest].filter(Boolean)
    if (chip) entry.badge = { ...chip, title: state }
    if (words.length) entry.note = words.join(' ')
    while (stack.at(-1)!.depth >= depth) stack.pop()
    stack.at(-1)!.children.push(entry)
    stack.push({ depth, children: entry.children })
  }
  const prune = (entries: Entry[]): object[] => entries.map(({ children, ...entry }) => (children.length ? { ...entry, children: prune(children) } : entry))
  return { type: 'filetree', items: prune(root) }
}
