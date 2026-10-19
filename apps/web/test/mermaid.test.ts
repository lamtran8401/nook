import { describe, expect, test } from 'bun:test'

import { checkSpec } from '@nook/desk/bench-check.ts'

import { parseDoc } from '@/lib/blocks.ts'

const fence = (lang: string, body: string) => `\`\`\`${lang}\n${body}\n\`\`\`\n`
const diagram = (md: string, places?: string[]) => {
  const [block] = parseDoc(md, { places }).blocks
  if (block?.kind !== 'diagram') throw new Error(`not a diagram: ${JSON.stringify(block)}`)
  return block
}

describe('a mermaid flowchart', () => {
  const FLOW = [
    'flowchart TB',
    '  page["web: page with the status select (new)"] -->|"the picked status"| client["web: client adds ?status= (changes)"]',
    '  client -->|"GET /shipments"| handler["api: handler checks the status (changes)"]',
    '  handler -->|"unknown"| bad["400: names the valid statuses (error)"]',
    '  handler -->|"known"| list["listShipments filters"]',
  ].join('\n')

  test('becomes a Bench graph with no places, each node coloured by its tag, its area as the kicker', () => {
    const { spec } = diagram(fence('mermaid', FLOW), ['web', 'api'])
    expect(spec).toEqual({
      type: 'graph',
      nodes: [
        { id: 'page', title: 'page with the status select', kicker: 'web · new', tone: 'success', fill: 'soft' },
        { id: 'client', title: 'client adds ?status=', kicker: 'web · changes', tone: 'primary' },
        { id: 'handler', title: 'handler checks the status', kicker: 'api · changes', tone: 'primary' },
        { id: 'bad', title: '400: names the valid statuses', kicker: 'error', tone: 'danger', fill: 'soft' },
        { id: 'list', title: 'listShipments filters', tone: 'neutral' },
      ],
      edges: [
        { from: 'page', to: 'client', label: 'the picked status' },
        { from: 'client', to: 'handler', label: 'GET /shipments' },
        { from: 'handler', to: 'bad', label: 'unknown' },
        { from: 'handler', to: 'list', label: 'known' },
      ],
    })
  })

  test('names in its legend each role that it uses', () => {
    expect(diagram(fence('mermaid', FLOW)).legend).toEqual([['success', 'new'], ['primary', 'changes'], ['danger', 'error'], ['neutral', 'stays as it is']])
  })

  test('a first node with no tag is where the flow starts, in ink', () => {
    const { spec, legend } = diagram(fence('mermaid', 'flowchart TB\n  a["Claude Code session"] --> b["plugins"]'))
    expect((spec.nodes as object[])[0]).toEqual({ id: 'a', title: 'Claude Code session', fill: 'ink' })
    expect(legend).toEqual([['ink', 'start'], ['neutral', 'stays as it is']])
  })

  test('a subgraph becomes a group that lists its nodes', () => {
    const { spec } = diagram(fence('mermaid', 'flowchart TB\n  subgraph browser["Browser"]\n    step["payment step"]\n  end\n  subgraph shop["Shop backend"]\n    pay["POST /payments (new)"]\n  end\n  step --> pay'))
    expect(spec.groups).toEqual([{ label: 'Browser', nodes: ['step'] }, { label: 'Shop backend', nodes: ['pay'] }])
  })
})

describe('the other mermaid kinds', () => {
  test('a sequenceDiagram becomes a Bench sequence with parts, calls, replies and notes', () => {
    const { spec } = diagram(fence('mermaid', 'sequenceDiagram\n  participant B as browser\n  participant L as ledger\n  B->>L: read the item\n  L-->>B: the item\n  Note over B: draws the page'))
    expect(spec).toEqual({
      type: 'sequence',
      parts: [{ id: 'B', label: 'browser', icon: 'monitor', tone: 'primary' }, { id: 'L', label: 'ledger', icon: 'database', tone: 'success' }],
      steps: [{ from: 'B', to: 'L', label: 'read the item' }, { from: 'L', to: 'B', label: 'the item', reply: 1 }, { note: 'draws the page', over: ['B'] }],
    })
  })

  test('an erDiagram becomes a graph of tables, with a line from a key to the row that names it', () => {
    const { spec } = diagram(fence('mermaid', 'erDiagram\n  ORDER ||--o{ PAYMENT : has\n  ORDER {\n    uuid id PK\n  }\n  PAYMENT {\n    uuid id PK\n    uuid order_id FK\n  }'))
    expect(spec.nodes).toEqual([
      { id: 'order', at: [1, 1], shape: 'table', icon: 'database', title: 'order', rows: [{ type: 'uuid', name: 'id', key: 'PK' }] },
      { id: 'payment', at: [1, 2], shape: 'table', icon: 'database', title: 'payment', rows: [{ type: 'uuid', name: 'id', key: 'PK' }, { type: 'uuid', name: 'order_id', key: 'FK' }] },
    ])
    expect(spec.edges).toEqual([{ from: 'order.id', to: 'payment.order_id', start: 'one-one', end: 'zero-many' }])
  })

  test('a tree fence becomes a Bench file tree, each file with the chip of its state and its note', () => {
    expect(diagram(fence('tree', 'api/\n  src/\n    keys.ts  new  makes the key once\n    cart.ts  changed')).spec).toEqual({
      type: 'filetree',
      items: [{ name: 'api/', children: [{ name: 'src/', children: [{ name: 'keys.ts', badge: { text: 'A', tone: 'success', title: 'new' }, note: 'makes the key once' }, { name: 'cart.ts', badge: { text: 'M', tone: 'warning', title: 'changed' } }] }] }],
    })
  })

  test('a mermaid kind with no drawing becomes an unknown block that names it and its line', () => {
    expect(parseDoc(`Text.\n\n${fence('mermaid', 'pie title Pets\n  "Dogs" : 3')}`).blocks[1]).toMatchObject({ kind: 'unknown', line: 3, reason: 'a mermaid pie is not drawn yet' })
  })
})

describe('the drawings of the fences', () => {
  test('each one passes the schema of Bench', () => {
    const fences = [
      fence('mermaid', 'flowchart TB\n  subgraph b["Browser"]\n    p["page (new)"]\n  end\n  p -->|"go"| a["api"]'),
      fence('mermaid', 'sequenceDiagram\n  participant B as browser\n  participant L as ledger\n  B->>L: read\n  L-->>B: item'),
      fence('mermaid', 'erDiagram\n  ORDER ||--o{ PAYMENT : has\n  ORDER {\n    uuid id PK\n  }\n  PAYMENT {\n    uuid order_id FK\n  }'),
      fence('tree', 'api/\n  keys.ts  new  the key'),
    ]
    expect(fences.flatMap(md => checkSpec(diagram(md).spec))).toEqual([])
  })
})
