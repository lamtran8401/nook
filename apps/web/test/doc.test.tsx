import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { Blocks } from '../components/blocks/Blocks.tsx'
import { parseDoc } from '../lib/blocks.ts'

const render = (md: string) => renderToStaticMarkup(<Blocks blocks={parseDoc(md).blocks} />)
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

describe('Blocks', () => {
  test('renders prose as plain HTML: headings, paragraphs, lists and dividers', () => {
    expect(render('## Why\n\nA **reason** and `code`.\n\n2. second\n3. third\n\n---\n')).toBe(
      '<h2>Why</h2><p>A <strong>reason</strong> and <code class="bn-inline-code">code</code>.</p><ol start="2"><li><p>second</p></li><li><p>third</p></li></ol><hr/>',
    )
  })

  test('renders a table as the Bench table', () => {
    expect(render('| A | B |\n|---|---|\n| 1 | 2 |\n')).toBe(
      '<div class="bn-table-wrap"><table class="bn-table"><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>',
    )
  })

  test('renders a quote and a code block with their Bench components', () => {
    expect(render('> Ship it.\n')).toBe('<figure class="bn-quote"><blockquote><p>Ship it.</p></blockquote></figure>')
    expect(render('```ts\nconst a = 1 < 2\n```\n')).toBe('<figure class="bn-code"><div class="bn-code__head"><span>ts</span></div><pre><code>const a = 1 &lt; 2</code></pre></figure>')
  })

  test('renders each panel as an alert of its tone, and a decision with its mark', () => {
    expect(render(':::error\nThe charge failed.\n:::\n')).toBe(
      '<div class="bn-alert" data-tone="danger"><div class="bn-alert__icon">×</div><div><div class="bn-alert__label">Error</div><div class="bn-alert__body"><p>The charge failed.</p></div></div></div>',
    )
    expect(render(':::decision\nUse UTC.\n:::\n')).toContain('<div class="bn-alert" data-tone="primary" data-kind="decision"><div class="bn-alert__icon">◆</div><div><div class="bn-alert__label">Decision</div>')
  })

  test('renders an expand as an accordion, and columns as a grid', () => {
    expect(render(':::expand Why UTC\nOne zone.\n:::\n')).toBe(
      '<div class="bn-accordion"><details><summary>Why UTC</summary><div class="bn-accordion__body"><p>One zone.</p></div></details></div>',
    )
    expect(render(':::columns\nLeft.\n\n---\n\nRight.\n:::\n')).toBe('<div class="bn-grid" style="--cols:2"><div><p>Left.</p></div><div><p>Right.</p></div></div>')
  })

  test('renders a task list as the Bench checklist, the done boxes checked', () => {
    expect(render('- [x] the api filters\n- [ ] the page lists\n')).toBe(
      '<ul class="bn-checklist__list"><li class="bn-checklist__item" data-state="done"><span class="bn-checklist__box">✓</span><span class="bn-checklist__text"><p>the api filters</p></span></li><li class="bn-checklist__item"><span class="bn-checklist__box"></span><span class="bn-checklist__text"><p>the page lists</p></span></li></ul>',
    )
  })

  test('renders a status as a badge of its tone, and a date as a chip', () => {
    expect(render('T1 is {status:done}, T2 is {status:blocked}, due {date:2026-10-18}.\n')).toBe(
      '<p>T1 is <span class="bn-badge" data-tone="success">done</span>, T2 is <span class="bn-badge" data-tone="danger">blocked</span>, due <time class="bn-badge" data-variant="plain" dateTime="2026-10-18">18 Oct 2026</time>.</p>',
    )
  })

  test('renders a safe link, and the words of a link to a script', () => {
    expect(render('[the plan](plan.md) and [x](javascript:alert(1))\n')).toBe('<p><a href="plan.md">the plan</a> and x</p>')
  })

  test('shows an unknown block as text with a warning, never as an error', () => {
    expect(text(render(':::poster\nBig words.\n:::\n'))).toBe('! This block was not shown No block is named poster (line 1). :::poster Big words. :::')
  })

  test('shows raw HTML as its text', () => {
    expect(render('<b onclick="x()">hi</b>\n')).toBe('<p>&lt;b onclick=&quot;x()&quot;&gt;hi&lt;/b&gt;</p>')
  })
})
