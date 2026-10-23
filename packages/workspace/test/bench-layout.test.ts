import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

import { pluginDir } from '../src/features.ts'

type Node = { id: string; at?: [number, number]; span?: [number, number]; [field: string]: unknown }
type Edge = { from: string; to: string; label?: string; a?: string; b?: string; split?: boolean }
type Group = { label: string; nodes?: string[]; at?: number[]; icon?: string; pad?: number }
type Spec = { type: 'graph'; nodes: Node[]; edges?: Edge[]; groups?: Group[]; cols?: number; rowGap?: number }

/** The layout of the Bench bundle, loaded with a small fake DOM: it needs no page. */
function loadLayout(): (spec: Spec) => Spec {
  const js = readFileSync(join(pluginDir(), 'ui', 'bench', 'bundle.js'), 'utf8')
  const element = () => ({ getContext: () => ({ measureText: () => ({ width: 40 }), font: '' }), style: {}, setAttribute() {}, appendChild() {} })
  const document = { readyState: 'complete', querySelectorAll: () => [], addEventListener() {}, createElement: element, documentElement: { dataset: {}, setAttribute() {}, getAttribute: () => null }, body: { appendChild() {} } }
  const sandbox: Record<string, unknown> = { document, console, localStorage: { getItem: () => null, setItem() {} }, matchMedia: () => ({ matches: false, addEventListener() {} }) }
  sandbox.window = sandbox
  runInNewContext(js, sandbox)
  return (sandbox.BenchDiagrams as { layout: (spec: Spec) => Spec }).layout
}

const layout = loadLayout()
const graph = (nodes: string[], edges: [string, string, string?][], groups?: Group[]): Spec => ({
  type: 'graph',
  nodes: nodes.map(id => ({ id, title: id })),
  edges: edges.map(([from, to, label]) => ({ from, to, ...(label ? { label } : {}) })),
  ...(groups ? { groups } : {}),
})
const placed = (spec: Spec) => Object.fromEntries(spec.nodes.map(n => [n.id, n.at]))
const rowOf = (spec: Spec, id: string) => placed(spec)[id]![0]
const colOf = (spec: Spec, id: string) => placed(spec)[id]![1]

/** The pairs of lines between two rows that cross, by the columns of their ends. */
function crossings(spec: Spec): number {
  const edges = (spec.edges ?? []).map(e => [placed(spec)[e.from]!, placed(spec)[e.to]!] as const)
  let count = 0
  for (const [a1, b1] of edges)
    for (const [a2, b2] of edges)
      if (a1[0] === a2[0] && b1[0] === b2[0] && a1[1] < a2[1] && b1[1] > b2[1]) count++
  return count
}

describe('the layout of a Bench graph', () => {
  test('leaves a graph with its places as it is', () => {
    const spec: Spec = { type: 'graph', cols: 2, nodes: [{ id: 'a', at: [1, 1] }, { id: 'b', at: [1, 2] }] }
    expect(layout(spec)).toBe(spec)
  })

  test('refuses a graph where some nodes have places and some do not', () => {
    expect(() => layout({ type: 'graph', nodes: [{ id: 'a', at: [1, 1] }, { id: 'b' }] })).toThrow('give every node a place, or none')
  })

  test('puts each node on the row of its longest path from a source', () => {
    const spec = layout(graph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['a', 'c']]))
    expect(['a', 'b', 'c'].map(id => rowOf(spec, id))).toEqual([1, 2, 3])
  })

  test('a loop keeps the rows of its way down; the line back up runs around the outside of its two nodes', () => {
    const spec = layout(graph(['cart', 'pick', 'charge', 'paid', 'retry'], [['cart', 'pick'], ['pick', 'charge'], ['charge', 'paid', 'paid'], ['charge', 'retry', 'declined'], ['retry', 'charge', 'after 1, 5, 30 min']]))
    expect(['cart', 'pick', 'charge', 'paid', 'retry'].map(id => rowOf(spec, id))).toEqual([1, 2, 3, 4, 4])
    expect(colOf(spec, 'retry')).toBeGreaterThan(colOf(spec, 'charge'))
    expect(spec.edges!.find(e => e.from === 'retry')).toMatchObject({ a: 'r', b: 'r' })
    expect(spec.edges!.find(e => e.from === 'charge' && e.to === 'retry')).toMatchObject({ a: 'b', b: 't' })
  })

  test('a node that closes a loop sits at the right end of its row, so its line back runs on the right', () => {
    const spec = layout(graph(['charge', 'retry', 'paid'], [['charge', 'retry', 'declined'], ['charge', 'paid', 'paid'], ['retry', 'charge', 'again']]))
    expect(colOf(spec, 'retry')).toBeGreaterThan(colOf(spec, 'paid'))
    expect(spec.edges!.find(e => e.from === 'retry')).toMatchObject({ a: 'r', b: 'r' })
  })

  test('a loop in one column runs back up along the right side of its two nodes', () => {
    const spec = layout(graph(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['c', 'b', 'again']]))
    expect(colOf(spec, 'c')).toBe(colOf(spec, 'b'))
    expect(spec.edges!.find(e => e.from === 'c')).toMatchObject({ a: 'r', b: 'r' })
  })

  test('puts a source one row above its first child', () => {
    const spec = layout(graph(['a', 'b', 'c', 'x'], [['a', 'b'], ['b', 'c'], ['x', 'c']]))
    expect(rowOf(spec, 'x')).toBe(2)
  })

  test('gives no two nodes the same cell', () => {
    const spec = layout(graph(['a', 'b', 'c', 'd', 'e', 'f'], [['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e'], ['c', 'e'], ['d', 'f']]))
    const cells = spec.nodes.flatMap(n => [0, 1].map(k => `${n.at![0]}:${n.at![1] + k}`))
    expect(new Set(cells).size).toBe(cells.length)
  })

  test('orders the rows so that two lines that need not cross do not', () => {
    expect(crossings(layout(graph(['a', 'b', 'c', 'd'], [['a', 'd'], ['b', 'c']])))).toBe(0)
  })

  test('puts a child under the middle of its parents', () => {
    const spec = layout(graph(['a', 'b', 'c'], [['a', 'c'], ['b', 'c']]))
    expect(colOf(spec, 'c')).toBe((colOf(spec, 'a') + colOf(spec, 'b')) / 2)
  })

  test('gives two lines down from one node one stem, and more room when they have labels', () => {
    const spec = layout(graph(['a', 'b', 'c'], [['a', 'b', 'known'], ['a', 'c', 'unknown']]))
    expect(spec.edges!.map(e => [e.a, e.b, e.split])).toEqual([['b', 't', true], ['b', 't', true]])
    expect(spec.rowGap).toBe(84)
  })

  test('makes each group a column, stacks its nodes, and joins two groups by their facing sides', () => {
    const spec = layout(graph(['page', 'api', 'db'], [['page', 'api'], ['api', 'db']], [{ label: 'Browser', nodes: ['page'] }, { label: 'Shop backend', nodes: ['api', 'db'] }]))
    expect(placed(spec)).toEqual({ page: [1, 1], api: [1, 2], db: [2, 2] })
    expect(spec.cols).toBe(2)
    expect(spec.groups).toEqual([
      { label: 'Browser', icon: 'monitor', at: [1, 1, 1, 1], pad: 14 },
      { label: 'Shop backend', icon: 'server', at: [1, 2, 2, 2], pad: 14 },
    ])
    expect(spec.edges!.map(e => [e.from, e.to, e.a, e.b])).toEqual([['page', 'api', 'r', 'l'], ['api', 'db', 'b', 't']])
  })

  describe('with groups that skip one another', () => {
    const system = () =>
      layout(
        graph(
          ['step', 'pay', 'cards', 'vault', 'provider', 'queue', 'job'],
          [['step', 'pay'], ['step', 'cards'], ['pay', 'vault'], ['vault', 'provider'], ['pay', 'queue', 'declined'], ['queue', 'job'], ['job', 'vault']],
          [{ label: 'Browser', nodes: ['step'] }, { label: 'Shop backend', nodes: ['pay', 'cards', 'vault'] }, { label: 'Payment provider', nodes: ['provider'] }, { label: 'Worker', nodes: ['queue', 'job'] }],
        ),
      )

    test('orders the groups so that no line between two groups meets a node of a group between them', () => {
      const spec = system()
      const at = placed(spec)
      const met = (spec.edges ?? []).filter(e => {
        const [r1, c1] = at[e.from]!, [r2, c2] = at[e.to]!
        return spec.nodes.some(n => {
          const [r, c] = n.at!
          return c > Math.min(c1, c2) && c < Math.max(c1, c2) && r >= Math.min(r1, r2) && r <= Math.max(r1, r2)
        })
      })
      expect(met.map(e => `${e.from}→${e.to}`)).toEqual([])
    })

    test('a line that skips rows in its group curves on the side with fewer lines to other groups', () => {
      const spec = system()
      const shop = colOf(spec, 'pay')
      const right = (spec.edges ?? []).filter(e => [e.from, e.to].some(id => colOf(spec, id) > shop) && [e.from, e.to].some(id => colOf(spec, id) === shop)).length
      const left = (spec.edges ?? []).filter(e => [e.from, e.to].some(id => colOf(spec, id) < shop) && [e.from, e.to].some(id => colOf(spec, id) === shop)).length
      expect(spec.edges!.find(e => e.from === 'pay' && e.to === 'vault')!.a).toBe(right > left ? 'l' : 'r')
    })
  })
})
