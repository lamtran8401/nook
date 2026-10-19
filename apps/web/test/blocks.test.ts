import { describe, expect, test } from 'bun:test'

import { type Block, parseDoc } from '@/lib/blocks.ts'

const kinds = (blocks: Block[]) => blocks.map(b => b.kind)
const only = (md: string) => {
  const { blocks } = parseDoc(md)
  expect(blocks).toHaveLength(1)
  return blocks[0]!
}

describe('parseDoc', () => {
  test('reads the front matter and the title, and keeps them out of the blocks', () => {
    const doc = parseDoc('---\nid: SHOP-12\nupdated: 2026-10-18\n---\n\n# SHOP-12: the plan\n\nThe text.\n')
    expect(doc.meta).toEqual({ id: 'SHOP-12', updated: '2026-10-18' })
    expect(doc.title).toBe('SHOP-12: the plan')
    expect(kinds(doc.blocks)).toEqual(['paragraph'])
  })

  test('reads headings, paragraphs, lists and dividers as prose blocks', () => {
    expect(kinds(parseDoc('## Why\n\nA reason.\n\n- one\n- two\n\n1. first\n\n---\n').blocks)).toEqual(['heading', 'paragraph', 'list', 'list', 'divider'])
  })

  test('reads a task list as a checklist with each box', () => {
    expect(only('- [x] the api filters\n- [ ] the page lists the statuses\n')).toMatchObject({ kind: 'tasks', items: [{ checked: true }, { checked: false }] })
  })

  test('reads a GFM table with its head and its rows', () => {
    const table = only('| Decision | Why |\n|---|---|\n| UTC | one zone |\n')
    expect(table).toMatchObject({ kind: 'table' })
    expect(table.kind === 'table' && [table.head.length, table.rows.length]).toEqual([2, 1])
  })

  test('reads a quote and a code block with its language', () => {
    expect(kinds(parseDoc('> A word of the owner.\n\n```ts\nconst a = 1\n```\n').blocks)).toEqual(['quote', 'code'])
    expect(parseDoc('```ts\nconst a = 1\n```\n').blocks[0]).toMatchObject({ kind: 'code', lang: 'ts', text: 'const a = 1' })
  })

  test('reads a bench fence as a diagram, and a broken one as an unknown block that names its line', () => {
    expect(only('```bench\n{"type":"filetree","items":[]}\n```\n')).toEqual({ kind: 'diagram', spec: { type: 'filetree', items: [] } })
    expect(parseDoc('Text.\n\n```bench\n{ broken\n```\n').blocks[1]).toMatchObject({ kind: 'unknown', line: 3, reason: 'the bench block is not valid JSON' })
  })

  test('reads each panel, a decision, an expand with its title, and columns split by ---', () => {
    const doc = parseDoc(':::warning\nThe card expires.\n:::\n\n:::decision\nUse UTC.\n:::\n\n:::expand Why UTC\nOne zone for every shop.\n:::\n\n:::columns\nLeft.\n\n---\n\nRight.\n:::\n')
    expect(doc.blocks).toMatchObject([
      { kind: 'panel', tone: 'warning' },
      { kind: 'decision' },
      { kind: 'expand', title: 'Why UTC' },
      { kind: 'columns', columns: [[{ kind: 'paragraph' }], [{ kind: 'paragraph' }]] },
    ])
  })

  test('keeps Markdown inside a panel, and a ::: inside a code block as code', () => {
    const doc = parseDoc(':::note\n- one\n- two\n:::\n\n```md\n:::info\n```\n')
    expect(doc.blocks).toMatchObject([{ kind: 'panel', tone: 'note', blocks: [{ kind: 'list' }] }, { kind: 'code', text: ':::info' }])
  })

  test('an unknown directive becomes an unknown block with its line and its text', () => {
    expect(parseDoc('Text.\n\n:::poster\nBig words.\n:::\n').blocks[1]).toEqual({ kind: 'unknown', line: 3, reason: 'no block is named poster', text: ':::poster\nBig words.\n:::' })
  })

  test('an unclosed ::: closes at the end of the file, and a warning names its line', () => {
    const doc = parseDoc('Text.\n\n:::info\nOpen to the end.\n')
    expect(doc.blocks).toMatchObject([{ kind: 'paragraph' }, { kind: 'panel', tone: 'info' }, { kind: 'unknown', line: 3, reason: 'the ::: of line 3 has no closing :::' }])
  })
})
