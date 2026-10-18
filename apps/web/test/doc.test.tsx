import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { Blocks } from '../components/blocks/Blocks.tsx'
import { parseDoc } from '../lib/blocks.ts'
import { text } from './markup.ts'

import type { Criterion } from '@nook/engineering/stores/criteria.ts'

const render = (md: string, criteria?: Criterion[]) => renderToStaticMarkup(<Blocks blocks={parseDoc(md).blocks} context={{ criteria }} />)

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
    expect(render('```ts\nconst a = 1 < 2\nconst b = 3\n```\n')).toBe(
      '<figure class="bn-code"><div class="bn-code__head"><span>ts</span></div><pre><code><span class="ln">const a = 1 &lt; 2\n</span><span class="ln">const b = 3\n</span></code></pre></figure>',
    )
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

describe('Blocks of the heading rules', () => {
  const criterion = (n: number, done: boolean): Criterion => ({ item: 'SHOP-42', n, text: '', done, evidence: null, grade: null, by: null, at: null })

  test('renders each criterion as a record with its kind, its sources, and its state from the ledger', () => {
    const markup = render('## Acceptance criteria\n\n- [ADD] A person pays in one click. (ticket AC1, Q2)\n- [CHANGE] A decline shows the reason.\n', [criterion(1, true), criterion(2, false)])
    expect(markup).toContain('<ol class="bn-records nk-records"><li><span class="bn-records__id">AC1</span><div class="nk-records__main"><p><span class="bn-badge" data-tone="success">ADD</span>A person pays in one click.<span class="bn-records__meta"> ticket AC1, Q2</span></p></div><span class="nk-records__end"><span class="bn-badge" data-tone="success">met</span></span></li>')
    expect(text(markup)).toContain('AC2 CHANGE A decline shows the reason. open')
  })

  test('renders each rule with its label, its words and its sources, a guess with its impact', () => {
    expect(render('## Details\n\n- **Retries:** after 1, 5 and 30 minutes. (G5, high)\n')).toContain(
      '<ul class="bn-rules"><li><b>Retries</b><p>after 1, 5 and 30 minutes.</p><span class="bn-rules__src"><span class="bn-badge" data-tone="danger">G5 · high</span></span></li></ul>',
    )
  })

  test('renders a walkthrough with each part in its component', () => {
    const markup = render([
      '> In short: the api charges a saved card.',
      '## What works now', '- **Charge a saved card:** the page sends a card id.',
      '## Where to start reading', '1. `api/src/keys.ts`: the key of a payment.',
      '## Try it', '1. Run `bun test` in api. Every test passes.',
      '## Heads up', '- A code that the map does not know shows as declined.',
      '## Requirements met', '- A person can save a card.',
    ].join('\n\n'))
    const parts = ['data-tone="primary"><div class="bn-alert__icon">i</div><div><div class="bn-alert__label">In short', 'class="bn-pieces"', 'class="bn-steplist"', 'class="bn-steplist" data-variant="path"', '1 thing to know', 'class="bn-checklist" data-variant="met"']
    const at = parts.map(part => markup.indexOf(part))
    expect(at.every(i => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(text(markup)).toContain('Charge a saved card The page sends a card id.')
    expect(text(markup)).toContain('1 Run bun test in api. Every test passes.')
  })

  test('renders the kinds of no impact as chips', () => {
    expect(render('None: Cache, Consistency.\n')).toBe('<p class="nk-none"><span>No impact on</span><span class="bn-badge" data-variant="plain">Cache</span><span class="bn-badge" data-variant="plain">Consistency</span></p>')
  })

  test('renders a slice as a task card that says what it waits for', () => {
    const markup = render('## T2: Charge a token\n\n- area: api\n- depends: T1\n- acs: 1, 6\n- size: M\n- done when: a charge sends the token\n')
    expect(text(markup)).toBe('T2 api size M Charge a token Criteria 1, 6 Done when a charge sends the token after T1')
    expect(markup).toStartWith('<article class="bn-task">')
  })
})

describe('a drawn fence', () => {
  test('shows a flowchart with the legend of its roles under it', () => {
    const markup = render('```mermaid\nflowchart TB\n  a["start"] --> b["the page (new)"]\n```\n')
    expect(markup).toStartWith('<figure class="nk-figure"><div class="nk-diagram" data-nook-diagram=')
    expect(markup).toEndWith('<figcaption><span class="bn-legend"><span data-tone="ink">start</span><span data-tone="success">new</span></span></figcaption></figure>')
  })
})
