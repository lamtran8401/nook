import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { docPage, itemPage } from '../src/report/item-page.ts'
import { itemAt, LEAD, makeHome, SPEC, type TestHome, writeDoc } from './helpers.ts'

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
  test('is a whole document that a browser opens from the disk: doctype, head with the title, body', () => {
    const html = planned()
    expect(html.startsWith('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>SHOP-7: Reserve &lt;stock&gt; &amp; hold</title>')).toBe(true)
    expect(html).toContain('</style>\n</head>\n<body>\n<div class="bn-root kd-page">')
    expect(html.endsWith('</script>\n</body>\n</html>')).toBe(true)
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

  test('with no tab named, an item in planning opens on its plan, and the other panels are hidden', () => {
    const html = planned()
    expect([...html.matchAll(/<button type="button" class="bn-tabs__tab" role="tab" id="tab-(\w+)" data-doc="\w+" aria-controls="panel-\w+" aria-selected="(\w+)"/g)].map(m => [m[1], m[2]])).toEqual([
      ['spec', 'false'],
      ['plan', 'true'],
      ['tasks', 'false'],
    ])
    expect([...html.matchAll(/<div class="bn-tabs__panel" role="tabpanel" id="panel-(\w+)" aria-labelledby="tab-\w+"( hidden)?>/g)].map(m => [m[1], Boolean(m[2])])).toEqual([
      ['spec', true],
      ['plan', false],
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

  test('a page asked for the walkthrough tab opens on it', () => {
    planned()
    writeDoc(t, 'SHOP-7', 'walkthrough.md', '---\nid: SHOP-7\ncreated: 2026-10-18\nupdated: 2026-10-18\n---\n\n# SHOP-7: the walkthrough\n')
    const html = itemPage(t.kit(LEAD), 'SHOP-7', 'walkthrough')
    expect(html).toContain('id="tab-spec" data-doc="spec" aria-controls="panel-spec" aria-selected="false" tabindex="-1">')
    expect(html).toContain('id="tab-walkthrough" data-doc="walkthrough" aria-controls="panel-walkthrough" aria-selected="true" tabindex="0">')
    expect(html).toContain('id="panel-spec" aria-labelledby="tab-spec" hidden>')
    expect(html).not.toContain('id="panel-walkthrough" aria-labelledby="tab-walkthrough" hidden>')
  })

  test('with no tab named, an item in review opens on its walkthrough, or on its spec while it has none', () => {
    itemAt(t, 'cooking')
    t.kit(LEAD).ledger.run("UPDATE item SET state = 'review' WHERE id = 'SHOP-1'")
    const selected = () => /id="tab-(\w+)" data-doc="\w+" aria-controls="panel-\w+" aria-selected="true"/.exec(itemPage(t.kit(LEAD), 'SHOP-1'))?.[1]
    expect(selected()).toBe('spec')
    writeDoc(t, 'SHOP-1', 'walkthrough.md', '---\nid: SHOP-1\ncreated: 2026-10-18\nupdated: 2026-10-18\n---\n\n# SHOP-1: the walkthrough\n')
    expect(selected()).toBe('walkthrough')
  })

  test('a tab that the item does not have is refused with the tabs it has', () => {
    planned()
    expect(() => itemPage(t.kit(LEAD), 'SHOP-7', 'walkthrough')).toThrow('SHOP-7 has no walkthrough tab; its tabs: spec, plan, tasks')
  })

  test('an item with no walkthrough.md has no Walkthrough tab', () => {
    expect(planned()).not.toContain('id="tab-walkthrough"')
  })

  test('walkthrough.md adds a Walkthrough tab after Tasks, hidden at first, with its document', () => {
    planned()
    writeDoc(t, 'SHOP-7', 'walkthrough.md', '---\nid: SHOP-7\ncreated: 2026-10-18\nupdated: 2026-10-18\n---\n\n# SHOP-7: the walkthrough\n\n## The verdict\n\n- accept\n')
    const html = itemPage(t.kit(LEAD), 'SHOP-7')
    expect([...html.matchAll(/role="tab" id="tab-(\w+)"/g)].map(m => m[1])).toEqual(['spec', 'plan', 'tasks', 'walkthrough'])
    expect(html).toContain('<button type="button" class="bn-tabs__tab" role="tab" id="tab-walkthrough" data-doc="walkthrough" aria-controls="panel-walkthrough" aria-selected="false" tabindex="-1">Walkthrough</button>')
    expect(panelOf(html, 'walkthrough')).toContain('<h2 class="kd-sec__title">The verdict</h2>')
    expect(html).toContain('id="panel-walkthrough" aria-labelledby="tab-walkthrough" hidden>')
  })
})

describe('docPage', () => {
  const RETRY = '---\ncreated: 2026-10-18\nupdated: 2026-10-18\n---\n\n# How the export job retries\n\n> In short: a failed export runs again <twice>.\n\n## What changed\n\n```tree\napi/\n  export.ts  changed  the retry\n```\n'

  test('one document with no item is a whole page with its path, its title and its components', () => {
    const html = docPage('work/2026-10-18-export-retry/walkthrough.md', RETRY)
    expect(html.startsWith('<!doctype html>\n<html lang="en">\n<head>')).toBe(true)
    expect(html).toContain('<title>How the export job retries</title>')
    expect(html).toContain('<span class="kd-eyebrow">work/2026-10-18-export-retry/walkthrough.md</span><h1 class="bn-page-head__title">How the export job retries</h1>')
    expect(html).toContain('<div class="bn-tree kd-tree">')
    expect(html).toContain('a failed export runs again &lt;twice&gt;.')
    expect(html).not.toContain('role="tablist"')
  })

  test('a document with no title is named by its path', () => {
    expect(docPage('work/x/notes.md', 'plain text\n')).toContain('<title>work/x/notes.md</title>')
  })
})
