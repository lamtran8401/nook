import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { Blocks } from '@/components/blocks/blocks.tsx'
import { parseDoc } from '@/lib/blocks.ts'
import { text } from '@/test/markup.ts'

import type { Criterion } from '@nook/engineering/stores/criteria.ts'

const slots = (markup: string) => [...markup.matchAll(/data-slot="([\w-]+)"/g)].map(m => m[1])
const render = (md: string, criteria?: Criterion[]) => renderToStaticMarkup(<Blocks blocks={parseDoc(md).blocks} context={{ criteria }} />)

describe('Blocks', () => {
  test('renders prose as plain HTML: headings, paragraphs, lists and dividers, with code as the inline code of the kit', () => {
    const markup = render('## Why\n\nA **reason** and `code`.\n\n2. second\n3. third\n\n---\n')
    expect(markup).toStartWith('<h2>Why</h2><p>A <strong>reason</strong> and <code data-slot="inline-code"')
    expect(markup).toContain('>code</code>.</p><ol start="2"><li><p>second</p></li><li><p>third</p></li></ol><div data-orientation="horizontal" role="none" data-slot="separator"')
  })

  test('renders a table as the table of the kit', () => {
    const markup = render('| A | B |\n|---|---|\n| 1 | 2 |\n')
    expect(slots(markup)).toEqual(['table-container', 'table', 'table-header', 'table-row', 'table-head', 'table-head', 'table-body', 'table-row', 'table-cell', 'table-cell'])
    expect(text(markup)).toBe('A B 1 2')
  })

  test('renders a quote and a code block with their parts of the kit', () => {
    expect(slots(render('> Ship it.\n'))).toEqual(['quote'])
    const code = render('```ts\nconst a = 1 < 2\nconst b = 3\n```\n')
    expect(slots(code)).toEqual(['code-block'])
    expect(code).toContain('>const a = 1 &lt; 2\n</span>')
    expect(text(code)).toBe('ts const a = 1 < 2 const b = 3')
  })

  test('renders each panel as an alert of its tone, and a decision with its mark', () => {
    const error = render(':::error\nThe charge failed.\n:::\n')
    expect(error).toStartWith('<div data-slot="alert" data-tone="danger" role="note"')
    expect(text(error)).toBe('× Error The charge failed.')
    expect(text(render(':::decision\nUse UTC.\n:::\n'))).toBe('◆ Decision Use UTC.')
  })

  test('renders an expand as a part that opens, and columns side by side', () => {
    const expand = render(':::expand Why UTC\nOne zone.\n:::\n')
    expect(slots(expand)).toEqual(['collapsible', 'collapsible-trigger', 'collapsible-content'])
    expect(text(expand)).toBe('Why UTC One zone.')
    expect(render(':::columns\nLeft.\n\n---\n\nRight.\n:::\n')).toContain('><div class="grid content-start gap-3"><p>Left.</p></div><div class="grid content-start gap-3"><p>Right.</p></div></div>')
  })

  test('renders a task list as the checklist of the kit, the done boxes checked', () => {
    const markup = render('- [x] the api filters\n- [ ] the page lists\n')
    expect([...markup.matchAll(/data-state="(\w+)"/g)].map(m => m[1])).toEqual(['done', 'open'])
    expect(text(markup)).toBe('the api filters the page lists')
  })

  test('renders a status as a badge of its tone, and a date as a chip', () => {
    const markup = render('T1 is {status:done}, T2 is {status:blocked}, due {date:2026-10-18}.\n')
    expect([...markup.matchAll(/data-slot="badge" data-tone="(\w+)" data-variant="(\w+)"/g)].map(m => `${m[1]} ${m[2]}`)).toEqual(['success soft', 'danger soft', 'neutral outline'])
    expect(markup).toContain('dateTime="2026-10-18"')
    expect(text(markup)).toBe('T1 is done , T2 is blocked , due 18 Oct 2026 .')
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
    expect([...markup.matchAll(/data-slot="badge" data-tone="(\w+)"/g)].map(m => m[1])).toEqual(['success', 'success', 'primary', 'neutral'])
    expect(text(markup)).toBe('Acceptance criteria AC1 ADD A person pays in one click. ticket AC1, Q2 met AC2 CHANGE A decline shows the reason. open')
  })

  test('renders each rule with its label, its words and its sources; a guess gives the tile the tone of its impact', () => {
    const markup = render('## Details\n\n- **Retries:** after 1, 5 and 30 minutes. (G5, high)\n- **Zone:** UTC. (Q1)\n')
    expect([...markup.matchAll(/data-slot="icon-tile" data-tone="(\w+)"/g)].map(m => m[1])).toEqual(['danger', 'neutral'])
    expect(text(markup)).toBe('Details § Retries after 1, 5 and 30 minutes. G5 · high § Zone UTC. Q1')
  })

  test('renders a walkthrough with each part in its component, in order', () => {
    const markup = render([
      '> In short: the api charges a saved card.',
      '## What works now', '- **Charge a saved card:** the page sends a card id.',
      '## Where to start reading', '1. `api/src/keys.ts`: the key of a payment.',
      '## Try it', '1. Run `bun test` in api. Every test passes.',
      '## Heads up', '- A code that the map does not know shows as declined.',
      '## Requirements met', '- A person can save a card.',
    ].join('\n\n'))
    const parts = ['data-slot="alert" data-tone="primary"', 'data-slot="piece-grid"', 'data-slot="step-list" data-variant="numbered"', 'data-slot="step-list" data-variant="path"', '1 thing to know', 'data-slot="checklist"']
    const at = parts.map(part => markup.indexOf(part))
    expect(at.every(i => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(text(markup)).toContain('Charge a saved card The page sends a card id.')
    expect(text(markup)).toContain('1 Run bun test in api. Every test passes.')
  })

  test('renders the kinds of no impact as chips', () => {
    const markup = render('None: Cache, Consistency.\n')
    expect([...markup.matchAll(/data-variant="outline"[^>]*>(\w+)</g)].map(m => m[1])).toEqual(['Cache', 'Consistency'])
    expect(text(markup)).toBe('No impact on Cache Consistency')
  })

  test('renders a slice as a task card that says what it waits for', () => {
    const markup = render('## T2: Charge a token\n\n- area: api\n- depends: T1\n- acs: 1, 6\n- size: M\n- done when: a charge sends the token\n')
    expect(text(markup)).toBe('T2 api size M Charge a token Criteria 1, 6 Done when a charge sends the token after T1')
    expect(markup).toContain('data-task=""')
  })
})

describe('a drawn fence', () => {
  test('shows a flowchart with the legend of its roles under it', () => {
    const markup = render('```mermaid\nflowchart TB\n  a["start"] --> b["the page (new)"]\n```\n')
    expect(slots(markup)).toEqual(['diagram', 'legend'])
    expect([...markup.matchAll(/data-tone="(\w+)"[^>]*><span aria-hidden="true"[^>]*><\/span>(\w+)/g)].map(m => `${m[2]}:${m[1]}`)).toEqual(['start:ink', 'new:success'])
  })
})
