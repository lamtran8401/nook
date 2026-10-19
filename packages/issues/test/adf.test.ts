import { describe, expect, test } from 'bun:test'

import { adfToMarkdown } from '../src/adf.ts'

const doc = (...content: object[]) => ({ type: 'doc', version: 1, content })
const p = (...content: object[]) => ({ type: 'paragraph', content })
const t = (text: string, marks?: object[]) => ({ type: 'text', text, ...(marks ? { marks } : {}) })

describe('adfToMarkdown', () => {
  test('paragraphs, marks and links', () => {
    expect(adfToMarkdown(doc(p(t('A '), t('bold', [{ type: 'strong' }]), t(' and '), t('code', [{ type: 'code' }]), t(' and '), t('a link', [{ type: 'link', attrs: { href: 'https://x.test' } }])), p(t('Next.'))))).toBe('A **bold** and `code` and [a link](https://x.test)\n\nNext.')
  })

  test('headings, lists, a code block and a quote', () => {
    const md = adfToMarkdown(doc(
      { type: 'heading', attrs: { level: 3 }, content: [t('Rules')] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('one'))] }, { type: 'listItem', content: [p(t('two'))] }] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [p(t('first'))] }] },
      { type: 'codeBlock', attrs: { language: 'ts' }, content: [t('const a = 1')] },
      { type: 'blockquote', content: [p(t('quoted'))] },
    ))
    expect(md).toBe('### Rules\n\n- one\n- two\n\n1. first\n\n```ts\nconst a = 1\n```\n\n> quoted')
  })

  test('a mention, an emoji, a hard break, an inline card, a status and a rule', () => {
    expect(adfToMarkdown(doc(p({ type: 'mention', attrs: { text: '@Ana' } }, t(' ok '), { type: 'emoji', attrs: { shortName: ':tada:' } }, { type: 'hardBreak' }, { type: 'inlineCard', attrs: { url: 'https://x.test/1' } }, t(' '), { type: 'status', attrs: { text: 'DONE' } }), { type: 'rule' }))).toBe('@Ana ok :tada:\nhttps://x.test/1 DONE\n\n---')
  })

  test('a table becomes a Markdown table, and a panel a quote with its kind', () => {
    const cell = (text: string, type = 'tableCell') => ({ type, content: [p(t(text))] })
    expect(adfToMarkdown(doc({ type: 'table', content: [{ type: 'tableRow', content: [cell('A', 'tableHeader'), cell('B', 'tableHeader')] }, { type: 'tableRow', content: [cell('1'), cell('2')] }] }))).toBe('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(adfToMarkdown(doc({ type: 'panel', attrs: { panelType: 'warning' }, content: [p(t('Careful.'))] }))).toBe('> **Warning:** Careful.')
  })

  test('an image shows as a mark, and an unknown node keeps its text', () => {
    expect(adfToMarkdown(doc({ type: 'mediaSingle', content: [{ type: 'media', attrs: { alt: 'screen.png' } }] }, { type: 'someNewNode', content: [t('kept')] }))).toBe('[image: screen.png]\n\nkept')
  })
})
