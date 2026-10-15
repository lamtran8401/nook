import { describe, expect, test } from 'bun:test'

import { fileTreeHtml, parseFileTree } from '../src/report/file-tree.ts'

const TREE = `api/
  src/
    handler.ts  changed  reads the status query
    old.ts  deleted
  test/handler.test.ts  changed  four new tests
web/  the page
  src/page.ts  new  the status select <b>`

describe('parseFileTree', () => {
  test('reads the folders by their indent, and each file with its mark and its note', () => {
    expect(parseFileTree(TREE)).toEqual([
      {
        name: 'api',
        note: '',
        children: [
          {
            name: 'src',
            note: '',
            children: [
              { name: 'handler.ts', mark: 'changed', note: 'reads the status query' },
              { name: 'old.ts', mark: 'deleted', note: '' },
            ],
          },
          { name: 'test/handler.test.ts', mark: 'changed', note: 'four new tests' },
        ],
      },
      { name: 'web', note: 'the page', children: [{ name: 'src/page.ts', mark: 'new', note: 'the status select <b>' }] },
    ])
  })

  test('a file with no known mark keeps the words as its note', () => {
    expect(parseFileTree('notes.md  the plan')).toEqual([{ name: 'notes.md', mark: null, note: 'the plan' }])
  })
})

describe('fileTreeHtml', () => {
  test('a file row has the file icon, its name, a badge of the tone of its mark, and its note', () => {
    expect(fileTreeHtml(parseFileTree('page.ts  new  the select'))).toBe(
      '<div class="bn-tree kd-tree"><ul><li><span class="bn-tree__row"><span data-bn-icon="file"></span><span class="kd-tree__name">page.ts</span><span class="bn-badge" data-tone="success" data-size="sm">new</span><span class="kd-tree__note">the select</span></span></li></ul></div>',
    )
  })

  test('a folder is open and holds its rows', () => {
    const html = fileTreeHtml(parseFileTree('api/\n  a.ts  deleted'))
    expect(html).toBe(
      '<div class="bn-tree kd-tree"><ul><li><details open><summary><span class="bn-tree__row"><span data-bn-icon="folder"></span><span class="kd-tree__name">api</span></span></summary><ul><li><span class="bn-tree__row"><span data-bn-icon="file"></span><span class="kd-tree__name">a.ts</span><span class="bn-badge" data-tone="danger" data-size="sm">deleted</span></span></li></ul></details></li></ul></div>',
    )
  })

  test('the text of a row is escaped', () => {
    expect(fileTreeHtml(parseFileTree(TREE))).toContain('the status select &lt;b&gt;')
  })
})
