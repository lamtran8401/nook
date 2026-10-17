import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildPages, tableAfter, tree } from './build.ts'

let docs: string
beforeEach(() => {
  docs = mkdtempSync(join(tmpdir(), 'nook-pages-'))
  mkdirSync(join(docs, 'guide'))
  const chapter = (n: number, extra = '') => `# ${n}. Chapter ${n}\n\n> In short: chapter ${n}.\n\n${extra}\n`
  const files: Record<string, string> = {
    'README.md': '# The guide book\n\nRead [chapter 2](02-desks.md), [the report](../report.md) and [the reference](../reference/core.md).\n',
    '01-start.md': chapter(1),
    '02-desks.md': chapter(2),
    '03-day.md': chapter(3),
    '04-work.md': chapter(4, '## Pick a path\n\n| Path | Use |\n|---|---|\n| quick | a fix |\n'),
    '05-wiki.md': chapter(5),
    '06-learn.md': chapter(6, '## Each day\n\n| Part | What |\n|---|---|\n| cards | due |\n'),
    '07-blocks.md': chapter(7),
  }
  for (const [file, text] of Object.entries(files)) writeFileSync(join(docs, 'guide', file), text)
  writeFileSync(
    join(docs, 'report.md'),
    [
      '# The build report', '', '> In short: a report.', '',
      '## At a glance', '', '| Part | Count | Check it with |', '|---|---|---|',
      '| packs | 4: core, engineering, wiki, learn | `nook packs` |', '| tests | 560 in 64 files, 0 failures | `bun run check` |', '',
      '## Tests', '', '| Package | Tests | Files |', '|---|---|---|',
      '| core | 158 | 14 |', '| wiki | 21 | 2 |', '| total | 179 | 16 |', '',
    ].join('\n'),
  )
})
afterEach(() => rmSync(docs, { recursive: true, force: true }))

describe('tree', () => {
  test('gives each row its depth, and marks a folder', () => {
    const html = tree('docs/\n├── a.md      the first page\n└── sub/\n    └── b.md\n')
    expect(html).toContain('style="--d:0"><span class="tree-ic">')
    expect(html).toContain('<code class="tree-name is-folder">docs/</code>')
    expect(html).toContain('style="--d:2"')
    expect(html).toContain('<code class="tree-name">a.md</code><span class="tree-note">the first page</span>')
  })
})

describe('tableAfter', () => {
  test('reads the cells of the first table after a heading, with escaped pipes and no backticks', () => {
    const markdown = '# T\n\n## Numbers\n\nText.\n\n| Part | Count |\n|---|---|\n| tests | 560 |\n| find | `a \\| b` |\n\nAfter.\n'
    expect(tableAfter(markdown, 'Numbers')).toEqual([['tests', '560'], ['find', 'a | b']])
  })

  test('names the missing section', () => {
    expect(() => tableAfter('# T\n', 'Tests')).toThrow('report.md has no section Tests')
  })
})

describe('buildPages', () => {
  test('takes the numbers of the report from its tables', () => {
    const { report } = buildPages(docs, '', new Date(2026, 9, 17))
    expect(report).toContain('<span class="tile-n">560</span><span class="tile-l">tests pass</span>')
    expect(report).toContain('<mark>560 of 560 tests pass</mark>')
    expect(report).toContain('<span class="bar-val">158</span>')
    expect(report).not.toContain('<span class="bar-name">total</span>')
    expect(report).toContain('As of 17 Oct 2026')
  })

  test('points a chapter link at its section and the report link at the published report', () => {
    const { guide } = buildPages(docs, 'https://claude.ai/artifact/REPORT', new Date(2026, 9, 17))
    expect(guide).toContain('<a href="#ch-2">chapter 2</a>')
    expect(guide).toContain('<a href="https://claude.ai/artifact/REPORT" target="_blank" rel="noopener">the report</a>')
    expect(guide).toContain('the reference (<code>docs/reference/core.md</code>)')
    expect(guide).toContain('4 packs: core, engineering, wiki, learn')
  })
})
