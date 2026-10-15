import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { itemPage } from '../src/report/item-page.ts'
import { LEAD, makeHome, SPEC, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const FENCE = '```'
const PLAN_L = `---
id: SHOP-7
approach: hold the stock in one table
created: 2026-10-14
updated: 2026-10-16
---

# SHOP-7: the plan

> In short: one table of holds. The risk is a deadlock.

## Today

${FENCE}mermaid
flowchart TB
  cart --> pay
${FENCE}

## Approach

${FENCE}mermaid
flowchart TB
  cart --> holds
${FENCE}

| Decision | Why | If it fails |
|---|---|---|
| A table | a cache loses keys | a slow insert |

## Impact

None: all kinds.

## Flow

${FENCE}mermaid
sequenceDiagram
  cart->>bff: checkout
${FENCE}

## Proof

| AC | Layer | Proof |
|---|---|---|
| 1 | bff, service | a hold for each line |
| 2 | web, component | the cart shows the time |

## Risks

| Risk | Likelihood | What we do |
|---|---|---|
| Deadlocks | med | lock in order |
`

const TASKS_2 = `---
id: SHOP-7
created: 2026-10-14
updated: 2026-10-17
---

# SHOP-7: the slices

## T1: Add the table

- area: bff
- depends: none
- acs: AC1
- size: S

## T2: Reserve the lines

- area: bff
- depends: T1
- acs: AC1
- size: M

## T3: Show the time left

- area: web
- depends: T1
- acs: AC2
- size: S
- files: the cart page, its tests
`

const SPEC_7 = SPEC({ areas: ['bff', 'web'], size: 'L', acs: ['[ADD] checkout holds each line <script>alert(1)</script>', '[CHANGE] the cart shows the time left (Q1)'] })
  .replaceAll('SHOP-1', 'SHOP-7')

/** SHOP-7 in planning with a plan of size L and three slices imported. */
const planned = () => {
  const lead = t.kit(LEAD)
  lead.newItem({ id: 'SHOP-7', title: 'Reserve <stock> & hold', areas: ['bff', 'web'] })
  lead.moveItem('start', 'SHOP-7')
  writeDoc(t, 'SHOP-7', 'spec.md', SPEC_7)
  lead.moveItem('agree', 'SHOP-7')
  writeDoc(t, 'SHOP-7', 'plan.md', PLAN_L)
  writeDoc(t, 'SHOP-7', 'tasks.md', TASKS_2)
  lead.importTasks('SHOP-7')
  lead.ledger.run("UPDATE event SET at = '2026-10-01T09:00:00.000Z' WHERE type = 'start'")
  lead.ledger.run("UPDATE event SET at = '2026-10-02T09:00:00.000Z' WHERE type = 'agree'")
  return itemPage(lead, 'SHOP-7')
}

const THEME = '%%{init: {&quot;theme&quot;: &quot;neutral&quot;, &quot;flowchart&quot;: {&quot;useMaxWidth&quot;: false}, &quot;sequence&quot;: {&quot;useMaxWidth&quot;: false}, &quot;mindmap&quot;: {&quot;useMaxWidth&quot;: false}}}%%\n'
/** The source of each mermaid block, after the theme line that every block starts with. */
const mermaidSources = (html: string) => [...html.matchAll(/<pre class="mermaid">([\s\S]*?)<\/pre>/g)].map(m => m[1]!.replace(THEME, ''))
const panelOf = (html: string, name: string) => {
  const start = html.indexOf(`data-panel="${name}"`)
  const end = html.indexOf('data-panel="', start + 10)
  return html.slice(start, end < 0 ? html.indexOf('</main>') : end)
}

describe('itemPage', () => {
  test('starts with the title and the style, with no doctype and no html or body tag', () => {
    const html = planned()
    expect(html.startsWith('<title>SHOP-7: Reserve &lt;stock&gt; &amp; hold</title>\n<meta name="claude:viewport-fit-sides" content="cover">')).toBe(true)
    expect(/<!doctype|<html|<body/i.test(html)).toBe(false)
  })

  test('the overview mindmap has the item at the root and the Why, Areas, Criteria and Slices branches', () => {
    const map = mermaidSources(planned())[0]!
    expect(map.split('\n')).toEqual([
      'mindmap',
      '  root((SHOP-7 Reserve stock &amp; hold))',
      '    Why',
      '      the export shows the date of the shop.',
      '    Areas',
      '      bff',
      '      web',
      '    Criteria',
      '      bff',
      '        AC1 checkout holds each line script alert 1 /script',
      '      web',
      '        AC2 the cart shows the time left Q1',
      '    Slices',
      '      bff',
      '        T1 Add the table',
      '        T2 Reserve the lines',
      '      web',
      '        T3 Show the time left',
    ])
  })

  test('the criteria are grouped by tag when no slice and no plan names their area', () => {
    const lead = t.kit(LEAD)
    lead.newItem({ id: 'SHOP-8', title: 'two tags', areas: ['bff'] })
    lead.moveItem('start', 'SHOP-8')
    writeDoc(t, 'SHOP-8', 'spec.md', SPEC().replaceAll('SHOP-1', 'SHOP-8'))
    const map = mermaidSources(itemPage(lead, 'SHOP-8'))[0]!
    expect(map).toContain('    Criteria\n      ADD\n        AC1 the export has the right date\n      CHANGE\n        AC2 the error shows a reason')
  })

  test('the plan tab holds one mermaid block for each diagram of the plan', () => {
    expect(mermaidSources(panelOf(planned(), 'plan')).map(s => s.split('\n')[0])).toEqual(['flowchart TB', 'flowchart TB', 'sequenceDiagram'])
  })

  test('every mermaid block starts with the neutral theme', () => {
    const blocks = [...planned().matchAll(/<pre class="mermaid">([\s\S]*?)<\/pre>/g)].map(m => m[1]!)
    expect(blocks.length).toBe(5)
    expect(blocks.every(b => b.startsWith(THEME))).toBe(true)
  })

  test('the tasks tab holds the lanes: one subgraph for each area, drawn top to bottom, and an edge for each depends', () => {
    const lanes = mermaidSources(panelOf(planned(), 'tasks'))[0]!
    expect(lanes.split('\n')).toEqual([
      'flowchart TB',
      '  subgraph lane_bff[&quot;bff&quot;]',
      '    direction TB',
      '    T1[&quot;T1: Add the table&quot;]',
      '    T2[&quot;T2: Reserve the lines&quot;]',
      '  end',
      '  subgraph lane_web[&quot;web&quot;]',
      '    direction TB',
      '    T3[&quot;T3: Show the time left&quot;]',
      '  end',
      '  T1 --&gt; T2',
      '  T1 --&gt; T3',
    ])
  })

  test('a line under the lanes names the slices that start first and the ones that run side by side', () => {
    expect(planned()).toContain('<p class="lanes-note">Start first: T1. Side by side in different areas: T2 (bff) with T3 (web).</p>')
  })

  test('the audit line has the dates of the moves that happened and the updated date of each document', () => {
    expect(planned()).toContain('<p class="audit">start 2026-10-01 · agree 2026-10-02 · spec.md updated 2026-10-15 · plan.md updated 2026-10-16 · tasks.md updated 2026-10-17</p>')
  })

  test('the text of a document is escaped', () => {
    const html = planned()
    expect(html).toContain('checkout holds each line &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert')
  })

  test('only the first tab shows; the others keep their layout under the hidden class', () => {
    const html = planned()
    expect([...html.matchAll(/<div class="(panel[^"]*)"[^>]*data-panel="(\w+)"/g)].map(m => [m[2], m[1]])).toEqual([
      ['spec', 'panel'],
      ['plan', 'panel is-hidden'],
      ['tasks', 'panel is-hidden'],
    ])
    expect(html).toContain('.panel.is-hidden { position: absolute; visibility: hidden; left: 0; right: 0;')
  })

  test('a slice card shows its files line', () => {
    expect(panelOf(planned(), 'tasks')).toContain('<dt>Files</dt><dd>the cart page, its tests</dd>')
  })
})
