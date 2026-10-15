import { describe, expect, test } from 'bun:test'

import { renderDocument } from '../src/report/page-markdown.ts'

describe('renderDocument', () => {
  test('an AC line becomes a row with its number, a tag pill and its source', () => {
    const html = renderDocument('## Acceptance criteria\n\n- [REMOVE] the old **filter** goes (Q2)\n', 'spec')
    expect(html).toContain('<ol class="acs"><li><span class="ac-n">AC1</span><span class="tag tone-danger">REMOVE</span><span class="ac-t">the old <strong>filter</strong> goes <span class="src">Q2</span></span></li></ol>')
  })

  test('the In short quote becomes the In short box', () => {
    expect(renderDocument('> In short: one `status` filter.\n', 'spec')).toBe('<div class="short"><span class="label">In short</span><p>one <code>status</code> filter.</p></div>')
  })

  test('a table of three columns stacks on a phone and labels each cell with its column', () => {
    const html = renderDocument('| Risk | Likelihood | What we do |\n|---|---|---|\n| a <b> | low | watch |\n', 'plan')
    expect(html).toBe('<div class="table-wrap stack"><table><thead><tr><th>Risk</th><th>Likelihood</th><th>What we do</th></tr></thead><tbody><tr><td data-label="Risk" class="k"><span class="cell">a &lt;b&gt;</span></td><td data-label="Likelihood"><span class="cell">low</span></td><td data-label="What we do"><span class="cell">watch</span></td></tr></tbody></table></div>')
  })

  test('a mermaid fence becomes a mermaid block with the escaped source', () => {
    expect(renderDocument('```mermaid\nflowchart LR\n  a["x & y"] --> b\n```\n', 'plan')).toBe('<div class="dg-wrap"><pre class="mermaid">%%{init: {&quot;theme&quot;: &quot;neutral&quot;, &quot;flowchart&quot;: {&quot;useMaxWidth&quot;: false}, &quot;sequence&quot;: {&quot;useMaxWidth&quot;: false}, &quot;mindmap&quot;: {&quot;useMaxWidth&quot;: false}}}%%\nflowchart LR\n  a[&quot;x &amp; y&quot;] --&gt; b</pre></div>')
  })

  test('a slice of tasks.md becomes a card with its area, size, depends and fields', () => {
    const html = renderDocument('## T2: Show the time\n\n- area: web\n- depends: T1\n- acs: AC2\n- size: S\n- done when: the cart shows it\n', 'tasks')
    expect(html).toBe('<article class="slice"><header><span class="tid">T2</span><h4>Show the time</h4></header><div class="chips"><span class="chip area">web</span><span class="chip">size S</span><span class="chip">after T1</span></div><dl><dt>Criteria</dt><dd>AC2</dd><dt>Done when</dt><dd>the cart shows it</dd></dl></article>')
  })

  test('a section wraps its paragraphs and lists, and the comments of the template are gone', () => {
    const html = renderDocument('## Why\n\n<!-- guidance -->\nThe list is long\nand slow.\n\n- one\n- two\n', 'spec')
    expect(html).toBe('<section class="sec"><h3><span class="label">Why</span></h3>\n<p>The list is long and slow.</p>\n<ul class="facts"><li>one</li><li>two</li></ul>\n</section>')
  })
})
