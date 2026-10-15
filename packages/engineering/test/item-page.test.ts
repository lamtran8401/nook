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

const panelOf = (html: string, name: string) => {
  const start = html.indexOf(`id="panel-${name}"`)
  const end = html.indexOf('role="tabpanel"', start + 10)
  return html.slice(start, end < 0 ? html.indexOf('<script>') : end)
}

describe('itemPage', () => {
  test('starts with the title and the style, with no doctype and no html or body tag', () => {
    const html = planned()
    expect(html.startsWith('<title>SHOP-7: Reserve &lt;stock&gt; &amp; hold</title>\n<meta name="claude:viewport-fit-sides" content="cover">')).toBe(true)
    expect(/<!doctype|<html|<body/i.test(html)).toBe(false)
  })

  test('the page has no overview mindmap', () => {
    expect(planned()).not.toContain('mindmap')
  })

  test('the page carries the UI kit: its tokens, its components and its script', () => {
    const html = planned()
    expect(html).toContain('--primary: #2b4de6;')
    expect(html).toContain('.bn-node {')
    expect(html).toContain('window.Bench = {')
    expect(html).toContain('<div class="bn-root kd-page">')
  })

  test('the plan tab draws each flowchart and sequence diagram with nodes of the UI kit, not mermaid', () => {
    const plan = panelOf(planned(), 'plan')
    expect(plan.match(/<figure class="kd-dg">/g)?.length).toBe(3)
    expect(plan.match(/class="kd-seq"/g)?.length).toBe(1)
    expect(plan).not.toContain('<pre class="mermaid">')
  })

  test('the tasks tab draws one group for each area and a node for each slice', () => {
    const tasks = panelOf(planned(), 'tasks')
    expect([...tasks.matchAll(/<span class="bn-group__label">(\w+)<\/span>/g)].map(m => m[1])).toEqual(['bff', 'web'])
    expect(tasks.match(/class="kd-lanes__cell"/g)?.length).toBe(3)
  })

  test('a line under the lanes names the slices that start first and the ones that run side by side', () => {
    expect(planned()).toContain('<p class="kd-lanes-note">Start first: T1. Side by side in different areas: T2 (bff) with T3 (web).</p>')
  })

  test('the audit line has the dates of the moves that happened and the updated date of each document', () => {
    expect(planned()).toContain('<p class="kd-audit">start 2026-10-01 · agree 2026-10-02 · spec.md updated 2026-10-15 · plan.md updated 2026-10-16 · tasks.md updated 2026-10-17</p>')
  })

  test('the text of a document is escaped', () => {
    const html = planned()
    expect(html).toContain('checkout holds each line &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert')
  })

  test('the first tab is selected and the other panels are hidden, each tied to its tab', () => {
    const html = planned()
    expect([...html.matchAll(/<button type="button" class="bn-tabs__tab" role="tab" id="tab-(\w+)" data-doc="\w+" aria-controls="panel-\w+" aria-selected="(\w+)"/g)].map(m => [m[1], m[2]])).toEqual([
      ['spec', 'true'],
      ['plan', 'false'],
      ['tasks', 'false'],
    ])
    expect([...html.matchAll(/<div class="bn-tabs__panel" role="tabpanel" id="panel-(\w+)" aria-labelledby="tab-\w+"( hidden)?>/g)].map(m => [m[1], Boolean(m[2])])).toEqual([
      ['spec', false],
      ['plan', true],
      ['tasks', true],
    ])
  })

  test('a hidden panel keeps its layout, so its diagrams keep their size', () => {
    expect(planned()).toContain('.kd-page .bn-tabs__panel[hidden] { display: flex; position: absolute;')
  })

  test('each panel names its file and its front matter above the title of the document', () => {
    expect(panelOf(planned(), 'plan')).toContain(
      '<div class="kd-doc-head"><p class="kd-doc-meta">work/SHOP-7/plan.md · approach hold the stock in one table · created 2026-10-14 · updated 2026-10-16</p><h2 class="kd-doc-title">SHOP-7: the plan</h2></div>',
    )
  })

  test('a slice card shows its files line', () => {
    expect(panelOf(planned(), 'tasks')).toContain('<dt>Files</dt><dd>the cart page, its tests</dd>')
  })
})
