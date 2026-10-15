import { describe, expect, test } from 'bun:test'

import { docTitle, renderDocument } from '../src/report/page-markdown.ts'

describe('renderDocument', () => {
  test('an AC line becomes a list row with its number, a tag badge of its tone and its source', () => {
    const html = renderDocument('## Acceptance criteria\n\n- [REMOVE] the old **filter** goes (Q2)\n', 'spec')
    expect(html).toContain(
      '<ul class="bn-list kd-acs"><li class="bn-list__item"><span class="bn-list__icon">AC1</span><span class="bn-list__main"><span class="kd-ac-tags"><span class="bn-badge" data-tone="danger" data-size="sm">REMOVE</span><span class="kd-ac-src">Q2</span></span><span>the old <strong>filter</strong> goes</span></span></li></ul>',
    )
  })

  test('the In short quote becomes an alert of the primary tone', () => {
    expect(renderDocument('> In short: one `status` filter.\n', 'spec')).toBe(
      '<div class="bn-alert" data-tone="primary"><span class="bn-alert__icon"><span data-bn-icon="info"></span></span><div><p class="bn-alert__label">In short</p><p class="bn-alert__body">one <code class="bn-inline-code">status</code> filter.</p></div></div>',
    )
  })

  test('a Need to know quote becomes an alert of the warning tone with that label', () => {
    expect(renderDocument('> Need to know: the export reuses this call.\n', 'walkthrough')).toBe(
      '<div class="bn-alert" data-tone="warning"><span class="bn-alert__icon"><span data-bn-icon="alert"></span></span><div><p class="bn-alert__label">Need to know</p><p class="bn-alert__body">the export reuses this call.</p></div></div>',
    )
  })

  test('another quote becomes a neutral Note alert', () => {
    expect(renderDocument('> keep the old text\n', 'plan')).toContain('<p class="bn-alert__label">Note</p><p class="bn-alert__body">keep the old text</p>')
  })

  test('the extra block goes right after the In short alert', () => {
    const html = renderDocument('> In short: two lanes.\n\nThe rest.\n', 'tasks', '<i>lanes</i>')
    expect(html.split('\n')).toEqual([expect.stringContaining('In short'), '<i>lanes</i>', '<div class="bn-prose"><p>The rest.</p></div>'])
  })

  test('with no In short alert, the extra block goes first', () => {
    expect(renderDocument('The rest.\n', 'tasks', '<i>lanes</i>')).toBe('<i>lanes</i>\n<div class="bn-prose"><p>The rest.</p></div>')
  })

  test('a table of three columns is a table of the UI kit that stacks on a phone, each cell with its column', () => {
    const html = renderDocument('| Risk | Likelihood | What we do |\n|---|---|---|\n| a <b> | low | watch |\n', 'plan')
    expect(html).toBe(
      '<div class="bn-table-wrap kd-stack"><table class="bn-table"><thead><tr><th>Risk</th><th>Likelihood</th><th>What we do</th></tr></thead><tbody><tr><td data-label="Risk">a &lt;b&gt;</td><td data-label="Likelihood">low</td><td data-label="What we do">watch</td></tr></tbody></table></div>',
    )
  })

  test('a table of two columns does not stack', () => {
    expect(renderDocument('| Kind | Impact |\n|---|---|\n| Data | none |\n', 'plan')).toStartWith('<div class="bn-table-wrap"><table class="bn-table">')
  })

  test('a mermaid fence of a kind that the kit does not draw stays a mermaid block, with the neutral theme', () => {
    expect(renderDocument('```mermaid\ngantt\n  title x & y\n```\n', 'plan')).toBe(
      '<figure class="kd-dg"><div class="kd-dg__scroll"><pre class="mermaid">%%{init: {&quot;theme&quot;: &quot;neutral&quot;, &quot;flowchart&quot;: {&quot;useMaxWidth&quot;: false}, &quot;sequence&quot;: {&quot;useMaxWidth&quot;: false}}}%%\ngantt\n  title x &amp; y</pre></div></figure>',
    )
  })

  test('a flowchart fence becomes nodes of the UI kit', () => {
    const html = renderDocument('```mermaid\nflowchart LR\n  a["x"] --> b\n```\n', 'plan')
    expect(html).toContain('<div class="bn-node" data-node="a" data-variant="root"><span class="bn-node__title">x</span></div>')
    expect(html).not.toContain('mermaid')
  })

  test('a tree fence becomes the Tree component of the UI kit', () => {
    expect(renderDocument('```tree\napi/\n  a.ts  new  the list\n```\n', 'walkthrough')).toStartWith('<div class="bn-tree kd-tree"><ul><li><details open>')
  })

  test('a list under Requirements met becomes a list with a check for each line', () => {
    expect(renderDocument('## Requirements met\n\n- the API filters by **status**\n', 'walkthrough')).toContain(
      '<ul class="bn-list kd-met"><li class="bn-list__item"><span class="bn-list__icon" data-tone="success"><span data-bn-icon="check"></span></span><span class="bn-list__main">the API filters by <strong>status</strong></span></li></ul>',
    )
  })

  test('another fence becomes a code block with one line for each line of text', () => {
    expect(renderDocument('```\nkit doctor\nkit init\n```\n', 'plan')).toBe('<div class="bn-code"><pre><span class="ln">kit doctor</span><span class="ln">kit init</span></pre></div>')
  })

  test('a slice of tasks.md becomes a card with its id, area and size, its fields, and what it waits for', () => {
    const html = renderDocument('## T2: Show the time\n\n- area: web\n- depends: T1\n- acs: AC2\n- size: S\n- done when: the cart shows it\n', 'tasks')
    expect(html).toBe(
      '<div class="kd-slices"><article class="bn-card"><span class="bn-card__eyebrow">T2 · web · size S</span><h3 class="bn-card__title">Show the time</h3><dl class="bn-dl"><dt>Criteria</dt><dd>AC2</dd><dt>Done when</dt><dd>the cart shows it</dd></dl><div class="bn-card__foot"><span class="bn-badge" data-size="sm">after T1</span></div></article></div>',
    )
  })

  test('two slices in a row share one list, and a slice with no depends starts first', () => {
    const html = renderDocument('## T1: One\n\n- depends: none\n\n## T2: Two\n\n- depends: T1\n', 'tasks')
    expect(html.match(/class="kd-slices"/g)?.length).toBe(1)
    expect(html.match(/<article class="bn-card">/g)?.length).toBe(2)
    expect(html).toContain('<span class="bn-badge" data-tone="success" data-size="sm">starts first</span>')
  })

  test('a section holds its title, then its paragraphs and lists in one prose block, and the comments of the template are gone', () => {
    const html = renderDocument('## Why\n\n<!-- guidance -->\nThe list is long\nand slow.\n\n- one\n- two\n', 'spec')
    expect(html).toBe(
      '<section class="kd-sec"><h2 class="kd-sec__title">Why</h2>\n<div class="bn-prose"><p>The list is long and slow.</p><ul><li>one</li><li>two</li></ul></div>\n</section>',
    )
  })

  test('the first heading is not in the body; the page shows it above the document', () => {
    const text = '# SHOP-1: the plan\n\n## Why\n\nA line.\n'
    expect(renderDocument(text, 'plan')).not.toContain('SHOP-1: the plan')
    expect(docTitle(text)).toBe('SHOP-1: the plan')
  })
})
