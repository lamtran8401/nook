import { describe, expect, test } from 'bun:test'

import { laneRows, parseFlowchart, parseSequence, renderDiagram } from '../src/report/diagrams.ts'

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

describe('renderDiagram', () => {
  test('a flowchart becomes an SVG with a box of its tone for each node and a legend of the tones it uses', () => {
    const html = renderDiagram(APPROACH)!
    expect(html).toContain('<svg class="dg"')
    expect(html.match(/class="dash-new"/g)?.length).toBe(1)
    expect(html.match(/class="solid-primary"/g)?.length).toBe(2)
    expect(html).toContain('class="solid-danger"')
    expect(html).toContain('<i class="l-dash"></i>new')
  })

  test('the text of a node is escaped', () => {
    expect(renderDiagram('flowchart TB\n  a["<b> & c"]')).toContain('&lt;b&gt; &amp; c')
  })

  test('a kind that it does not draw returns null, so the viewer draws the mermaid', () => {
    expect(renderDiagram('gantt\n  title x')).toBeNull()
  })
})
