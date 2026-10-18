import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { benchSchema, checkSpec } from '../src/bench-check.ts'
import { Catalog } from '../src/catalog.ts'

describe('benchSchema', () => {
  test('reads the fields of each diagram type from DIAGRAMS.md, with the fields of the items of a graph, a file tree and a board', () => {
    const schema = benchSchema()
    expect([...schema.graph!.top]).toEqual(expect.arrayContaining(['type', 'cols', 'nodes', 'edges', 'groups', 'colGap', 'frame']))
    expect([...schema.graph!.items.nodes!]).toEqual(expect.arrayContaining(['id', 'at', 'span', 'title', 'kicker', 'tone', 'fill', 'rows']))
    expect([...schema.graph!.items.edges!]).toEqual(expect.arrayContaining(['from', 'to', 'label', 'a', 'b', 'dash']))
    expect([...schema.filetree!.items.items!]).toEqual(expect.arrayContaining(['name', 'children', 'badge', 'note']))
    expect([...schema.board!.items.cards!]).toEqual(expect.arrayContaining(['id', 'title', 'kind', 'kindTone', 'kindIcon', 'flag']))
    expect([...schema.chart!.top]).toEqual(expect.arrayContaining(['kind', 'data', 'step', 'series', 'rows']))
    expect(Object.keys(schema).sort()).toEqual(['board', 'chart', 'compare', 'filetree', 'graph', 'links', 'mind', 'sequence', 'space', 'timeline'])
  })
})

describe('checkSpec', () => {
  const graph = {
    type: 'graph',
    nodes: [{ id: 'page', title: 'page' }, { id: 'api', title: 'api' }],
    edges: [{ from: 'page', to: 'api', label: 'status' }],
    groups: [{ label: 'Browser', nodes: ['page'] }],
  }

  test('finds nothing in a valid graph, sequence or file tree', () => {
    expect(checkSpec(graph)).toEqual([])
    expect(checkSpec({ type: 'sequence', parts: [{ id: 'b', label: 'browser' }, { id: 'l', label: 'ledger' }], steps: [{ from: 'b', to: 'l', label: 'read' }, { note: 'done', over: ['b'] }] })).toEqual([])
    expect(checkSpec({ type: 'filetree', items: [{ name: 'api/', children: [{ name: 'keys.ts', badge: { text: 'A', tone: 'success', title: 'new' } }] }] })).toEqual([])
  })

  test('names an edge to a node that the block does not have', () => {
    expect(checkSpec({ ...graph, edges: [{ from: 'page', to: 'vault' }] })).toEqual(['edge 1 goes to "vault", a node that the block does not have'])
  })

  test('names a field that the type does not know, at the top and in an item', () => {
    expect(checkSpec({ ...graph, colour: 'red' })).toEqual(['graph has no field "colour"'])
    expect(checkSpec({ ...graph, nodes: [{ id: 'page', title: 'page', colour: 'red' }, { id: 'api' }] })).toEqual(['node "page" has a field that a node of a graph does not have: "colour"'])
  })

  test('names a group member, a duplicate id and a step part that the block does not have', () => {
    expect(checkSpec({ ...graph, groups: [{ label: 'Browser', nodes: ['web'] }] })).toEqual(['group "Browser" lists "web", a node that the block does not have'])
    expect(checkSpec({ ...graph, nodes: [{ id: 'page' }, { id: 'page' }, { id: 'api' }] })).toEqual(['two nodes have the id "page"'])
    expect(checkSpec({ type: 'sequence', parts: [{ id: 'b' }], steps: [{ from: 'b', to: 'x', label: 'call' }] })).toEqual(['step 1 goes to "x", a part that the block does not have'])
  })

  test('names a missing type, an unknown type, a missing required field and a mix of placed and free nodes', () => {
    expect(checkSpec({ nodes: [] })).toEqual(['the block has no "type"'])
    expect(checkSpec({ type: 'pie' })).toEqual(['no diagram type is named "pie"; the types are graph, sequence, mind, links, filetree, timeline, compare, space, board and chart'])
    expect(checkSpec({ type: 'graph' })).toEqual(['graph needs "nodes"'])
    expect(checkSpec({ type: 'graph', nodes: [{ id: 'a', at: [1, 1] }, { id: 'b' }] })).toEqual(['give every node a place with "at", or none'])
  })
})

describe('the examples of DIAGRAMS.md', () => {
  test('each JSON example passes the schema that the same doc gives', () => {
    const doc = readFileSync(join(Catalog.load().dirOf('core'), 'ui', 'bench', 'DIAGRAMS.md'), 'utf8')
    const examples = [...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m => JSON.parse(m[1]!) as { type?: string })
    const problems = examples.flatMap(spec => checkSpec(spec).map(problem => `${spec.type}: ${problem}`))
    expect(examples.length).toBeGreaterThan(10)
    expect(problems).toEqual([])
  })
})
