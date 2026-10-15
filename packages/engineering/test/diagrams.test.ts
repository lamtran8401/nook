import { describe, expect, test } from 'bun:test'

import { flowLayers, lanesFigure, laneRows, parseFlowchart, parseSequence, renderDiagram } from '../src/report/diagrams.ts'

const APPROACH = `flowchart TB
  page["web: page with the status select (new)"] -->|"the picked status"| client["web: client adds ?status= (changes)"]
  client -->|"GET /shipments?status="| handler["api: handler checks the status (changes)"]
  handler -->|"unknown"| bad["400: names the valid statuses (error)"]
  handler -->|"known or empty"| list["listShipments filters, then sorts"]`

describe('parseFlowchart', () => {
  test('reads each node with its label, and the marker at the end of a label as its tone', () => {
    expect(parseFlowchart(APPROACH)?.nodes).toEqual([
      { id: 'page', label: 'web: page with the status select', tone: 'new' },
      { id: 'client', label: 'web: client adds ?status=', tone: 'changes' },
      { id: 'handler', label: 'api: handler checks the status', tone: 'changes' },
      { id: 'bad', label: '400: names the valid statuses', tone: 'danger' },
      { id: 'list', label: 'listShipments filters, then sorts', tone: 'ink' },
    ])
  })

  test('reads each edge with its label', () => {
    expect(parseFlowchart(APPROACH)?.edges.map(e => [e.from, e.to, e.label])).toEqual([
      ['page', 'client', 'the picked status'],
      ['client', 'handler', 'GET /shipments?status='],
      ['handler', 'bad', 'unknown'],
      ['handler', 'list', 'known or empty'],
    ])
  })

  test('a class after three colons sets the tone, and a later bare reference keeps the label', () => {
    const chart = parseFlowchart('graph LR\n  a["one"]:::new --> b\n  b --> a')
    expect(chart?.nodes).toEqual([
      { id: 'a', label: 'one', tone: 'new' },
      { id: 'b', label: 'b', tone: 'ink' },
    ])
  })

  test('a dotted arrow makes a dashed edge', () => {
    expect(parseFlowchart('flowchart TB\n  a -.-> b\n  b --> c')?.edges.map(e => e.dashed)).toEqual([true, false])
  })

  test('a text that is not a flowchart is not read', () => {
    expect(parseFlowchart('mindmap\n  root((x))')).toBeNull()
  })
})

describe('parseSequence', () => {
  test('reads the participants, the calls, the answers and a note over two of them', () => {
    const seq = parseSequence('sequenceDiagram\n  participant cart as Cart\n  participant orders as Orders\n  cart->>orders: POST /checkout\n  orders-->>cart: hold id\n  Note over cart,orders: one transaction')
    expect(seq).toEqual({
      actors: [{ id: 'cart', label: 'Cart' }, { id: 'orders', label: 'Orders' }],
      steps: [
        { kind: 'call', from: 'cart', to: 'orders', label: 'POST /checkout', reply: false },
        { kind: 'call', from: 'orders', to: 'cart', label: 'hold id', reply: true },
        { kind: 'note', from: 'cart', to: 'orders', label: 'one transaction' },
      ],
    })
  })
})

describe('laneRows', () => {
  test('a slice sits after its dependencies and after the slice before it in its lane', () => {
    const rows = laneRows([
      { id: 'T1', title: 'a', area: 'orders', depends: [] },
      { id: 'T2', title: 'b', area: 'orders', depends: ['T1'] },
      { id: 'T3', title: 'c', area: 'orders', depends: ['T2'] },
      { id: 'T4', title: 'd', area: 'orders', depends: ['T2'] },
      { id: 'T6', title: 'e', area: 'web', depends: ['T2'] },
    ])
    expect(Object.fromEntries(rows)).toEqual({ T1: 0, T2: 1, T3: 2, T4: 3, T6: 2 })
  })
})

describe('flowLayers', () => {
  test('a node sits one row under its lowest parent, and an edge back up does not move it', () => {
    const chart = parseFlowchart('flowchart TB\n  a --> b\n  b --> c\n  a --> c\n  c --> a')!
    expect(flowLayers(chart)).toEqual([['a'], ['b'], ['c']])
  })

  test('the nodes of a row follow the order of their parents, so the edges do not cross', () => {
    const chart = parseFlowchart('flowchart TB\n  r --> x\n  r --> y\n  y --> p\n  x --> q')!
    expect(flowLayers(chart)).toEqual([['r'], ['x', 'y'], ['q', 'p']])
  })
})

describe('renderDiagram', () => {
  test('a flowchart becomes rows of nodes, each in the variant of its tone', () => {
    const html = renderDiagram(APPROACH)!
    expect(html.match(/<div class="kd-layer">/g)?.length).toBe(4)
    expect(html).toContain('<div class="bn-node" data-node="page" data-variant="soft" data-tone="success"><span class="bn-node__kicker">web · new</span><span class="bn-node__title">page with the status select</span></div>')
    expect(html).toContain('<div class="bn-node" data-node="handler" data-tone="primary" data-state="active"><span class="bn-node__kicker">api · changes</span>')
    expect(html).toContain('<div class="bn-node" data-node="bad" data-variant="soft" data-tone="danger"><span class="bn-node__kicker">400 · error</span>')
    expect(html).toContain('<div class="bn-node" data-node="list" data-shape="pill"><span class="bn-node__title">listShipments filters, then sorts</span></div>')
  })

  test('a node with no edge into it and no tone is the dark root', () => {
    expect(renderDiagram('flowchart TB\n  a["web: start"] --> b["end"]')).toContain('<div class="bn-node" data-node="a" data-variant="root"><span class="bn-node__kicker">web</span>')
  })

  test('each edge is a path for the page script, in the tone of the node it reaches, with its label', () => {
    const html = renderDiagram(APPROACH)!
    expect(html).toContain('<path class="bn-edge kd-edge--main" data-tone="danger" data-edge="2" data-from="handler" data-to="bad"></path>')
    expect(html).toContain('<path class="bn-edge" data-edge="3" data-from="handler" data-to="list"></path>')
    expect(html).toContain('<span class="kd-edge-label" data-label="1">GET /shipments?status=</span>')
  })

  test('the legend names only the tones that the diagram uses', () => {
    expect(renderDiagram(APPROACH)).toContain('<figcaption class="bn-legend"><span data-tone="primary">changes</span><span data-tone="success">new</span><span data-tone="danger">error</span><span>stays as it is</span></figcaption>')
    expect(renderDiagram('flowchart TB\n  a --> b')).not.toContain('bn-legend')
  })

  test('a sequence diagram puts each call between the columns of its two participants', () => {
    const html = renderDiagram('sequenceDiagram\n  participant cart as Cart\n  participant bff\n  participant orders\n  cart->>orders: POST /checkout\n  orders-->>cart: hold id')!
    expect(html).toContain('<div class="kd-seq" style="--actors: 3">')
    expect(html).toContain('<span class="bn-node" data-shape="pill"><span class="bn-node__title">Cart</span></span>')
    expect(html).toContain('<div class="kd-seq__call" style="grid-column: 1 / 4; grid-row: 2; --span: 3"><span class="kd-seq__label">POST /checkout</span>')
    expect(html).toContain('<div class="kd-seq__call is-reply is-left" style="grid-column: 1 / 4; grid-row: 3; --span: 3">')
  })

  test('the text of a node is escaped', () => {
    expect(renderDiagram('flowchart TB\n  a["<b> & c"]')).toContain('&lt;b&gt; &amp; c')
  })

  test('a kind that it does not draw returns null, so the viewer draws the mermaid', () => {
    expect(renderDiagram('gantt\n  title x')).toBeNull()
  })
})

describe('lanesFigure', () => {
  const slices = [
    { id: 'T1', title: 'Add the table', area: 'bff', depends: [], acs: [1], size: 'S' },
    { id: 'T2', title: 'Reserve', area: 'bff', depends: [], acs: [1, 2], size: 'M' },
    { id: 'T3', title: 'Show the time', area: 'web', depends: ['T1'], acs: [3], size: 'S' },
  ]

  test('one group for each area and each slice in the cell of its area and row', () => {
    const html = lanesFigure(slices)
    expect([...html.matchAll(/<span class="bn-group__label">(\w+)<\/span>/g)].map(m => m[1])).toEqual(['bff', 'web'])
    expect(html).toContain('<div class="kd-lanes__cell" style="grid-column: 2; grid-row: 2"><div class="bn-node" data-node="T3"><span class="bn-node__kicker">T3 · size S</span><span class="bn-node__title">Show the time</span><span class="bn-node__meta">AC3</span></div></div>')
  })

  test('a depends is a solid edge, and the next slice of a lane with no depends a dashed one', () => {
    const html = lanesFigure(slices)
    expect(html).toContain('<path class="bn-edge" data-edge="0" data-from="T1" data-to="T3"></path>')
    expect(html).toContain('<path class="bn-edge bn-edge--dashed" data-edge="1" data-from="T1" data-to="T2"></path>')
  })
})
