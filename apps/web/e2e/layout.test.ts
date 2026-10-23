import { describe, expect, test } from 'bun:test'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { pluginDir } from '@nook/workspace/workspaces.ts'
import { runCommand } from '@nook/shared/run.ts'

import { type Block, parseDoc } from '../lib/blocks.ts'
import { type Diagram, layoutFaults } from './layout-probe.ts'

const repo = join(import.meta.dirname, '..', '..', '..')

/** The JSON examples of DIAGRAMS.md, each named by its place and the heading above it. */
function catalogSpecs(): Diagram[] {
  const doc = readFileSync(join(pluginDir(), 'ui', 'bench', 'DIAGRAMS.md'), 'utf8')
  const specs: Diagram[] = []
  let heading = ''
  for (const m of doc.matchAll(/^#{2,4} (.+)$|^```json\n([\s\S]*?)\n```/gm)) {
    if (m[1]) heading = m[1]
    else specs.push({ name: `DIAGRAMS.md ${specs.length + 1}: ${heading}`, spec: JSON.parse(m[2]!) })
  }
  return specs
}

const inner = (block: Block): Block[] =>
  'blocks' in block ? block.blocks : block.kind === 'list' ? block.items.flat() : block.kind === 'columns' ? block.columns.flat() : block.kind === 'tasks' ? block.items.flatMap(item => item.blocks) : []
const specsOf = (blocks: Block[]): object[] => blocks.flatMap(block => (block.kind === 'diagram' ? [block.spec] : specsOf(inner(block))))

/** Each drawn fence (mermaid, tree, bench) of the Markdown under docs/, plugin/ and the demo workspace, as the web app draws it. */
function fenceDiagrams(): Diagram[] {
  return ['docs', 'plugin', 'scripts/demo'].flatMap(top =>
    readdirSync(join(repo, top), { recursive: true, encoding: 'utf8' })
      .filter(rel => rel.endsWith('.md'))
      .sort()
      .flatMap(rel => specsOf(parseDoc(readFileSync(join(repo, top, rel), 'utf8')).blocks).map((spec, i) => ({ name: `${top}/${rel} ${i + 1}`, spec }))),
  )
}

/** The two pages of the docs, built by `bun run pages` as for their links. */
function docPages(): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), 'nook-pages-'))
  try {
    const run = runCommand(['bun', 'run', 'pages', dir], { cwd: repo, timeoutMs: 120_000 })
    if (run.code !== 0) throw new Error(`bun run pages failed: ${run.err}`)
    return Object.fromEntries(['guide', 'report'].map(page => [page, readFileSync(join(dir, `${page}.html`), 'utf8')]))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** The figures of the guide book and the build report, each named by the heading above it. */
function pageDiagrams(): Diagram[] {
  return Object.entries(docPages()).flatMap(([page, html]) => {
    const figures: Diagram[] = []
    let heading = ''
    for (const m of html.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>|<div data-bn-diagram><script type="application\/json">(.*?)<\/script>/gs)) {
      if (m[1] !== undefined) heading = m[1].replace(/<[^>]+>/g, '')
      else figures.push({ name: `the ${page} page ${figures.length + 1}: ${heading}`, spec: JSON.parse(m[2]!) })
    }
    return figures
  })
}

describe('the layout check', () => {
  test('names the diagram and the node when an edge goes through a node', () => {
    const spec = { type: 'graph', cols: 3, nodes: [{ id: 'a', at: [1, 1], title: 'a' }, { id: 'b', at: [1, 2], title: 'b' }, { id: 'c', at: [1, 3], title: 'c' }], edges: [{ from: 'a', to: 'c' }] }
    expect(layoutFaults([{ name: 'a row of three', spec }])).toEqual(['a row of three: the edge a → c goes through the node b'])
  })

  test('names both labels when two edges cross with their labels on each other', () => {
    const node = (id: string, at: number[]) => ({ id, at, title: id })
    const spec = { type: 'graph', cols: 3, rowGap: 60, nodes: [node('a', [1, 1]), node('b', [1, 3]), node('c', [3, 3]), node('d', [3, 1])], edges: [{ from: 'a', to: 'c', label: 'diagonal one' }, { from: 'b', to: 'd', label: 'diagonal two' }] }
    expect(layoutFaults([{ name: 'an X', spec }])).toEqual([
      'an X: the labels "diagonal one" and "diagonal two" overlap',
      'an X: the label "diagonal one" sits on the edge b → d',
      'an X: the label "diagonal two" sits on the edge a → c',
    ])
  })

  test('names a spec that does not draw', () => {
    expect(layoutFaults([{ name: 'a pie', spec: { type: 'pie' } }])).toEqual(['a pie: Diagram not drawn: unknown diagram type "pie"'])
  })
})

describe('the diagrams of Bench', () => {
  test('each of the 22 catalog specs draws with no edge through a node, no crowded label and no label on another edge', () => {
    const specs = catalogSpecs()
    expect(specs).toHaveLength(22)
    expect(layoutFaults(specs)).toEqual([])
  })

  test('each diagram of the docs draws the same way: the drawn fences, the demo workspace and the figures of the two doc pages', () => {
    const diagrams = [...fenceDiagrams(), ...pageDiagrams()]
    const sources = new Set(diagrams.map(d => d.name.replace(/ \d+(:.*)?$/, '')))
    expect([...sources]).toEqual([
      'docs/plan/v0.3.md', 'plugin/skills/write-plan/sections.md', 'plugin/skills/write-walkthrough/parts.md',
      'scripts/demo/items/SHOP-41/walkthrough.md', 'scripts/demo/items/SHOP-42/plan.md', 'scripts/demo/items/SHOP-43/plan.md', 'scripts/demo/items/SHOP-44/walkthrough.md',
      'the guide page', 'the report page',
    ])
    expect(layoutFaults(diagrams)).toEqual([])
  })
})
