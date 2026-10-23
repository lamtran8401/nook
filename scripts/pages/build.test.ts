import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildPages, DRAWN, sourceText, staleDiagrams, tableAfter, treeSpec } from './build.ts'

const REPO_DOCS = join(import.meta.dir, '../../docs')
/** The doc text of a drawn diagram, as the repo docs hold it, so a fixture passes the diagram check. */
function drawnText(draw: string): string {
  const source = DRAWN[draw]!
  return sourceText(readFileSync(join(REPO_DOCS, source.file), 'utf8'), source.heading, source.kind)!
}

let docs: string
beforeEach(() => {
  docs = mkdtempSync(join(tmpdir(), 'nook-pages-'))
  mkdirSync(join(docs, 'guide'))
  const chapter = (n: number, extra = '') => `# ${n}. Chapter ${n}\n\n> In short: chapter ${n}.\n\n${extra}\n`
  const files: Record<string, string> = {
    'README.md': '# The guide book\n\nRead [chapter 2](02-workspaces.md), [the report](../report.md) and [the reference](../reference/core.md).\n',
    '01-start.md': chapter(1),
    '02-workspaces.md': chapter(2, `## Nested workspaces\n\n${drawnText('workspaceDiagram')}\n`),
    '03-day.md': chapter(3),
    '04-work.md': chapter(4, `## The flow\n\n${drawnText('flowDiagram')}\n\n## Pick a path\n\n${drawnText('pathsDiagram')}\n`),
    '05-wiki.md': chapter(5),
    '06-blocks.md': chapter(6),
  }
  for (const [file, text] of Object.entries(files)) writeFileSync(join(docs, 'guide', file), text)
  writeFileSync(
    join(docs, 'report.md'),
    [
      '# The build report', '', '> In short: a report.', '',
      '## At a glance', '', '| Part | Count | Check it with |', '|---|---|---|',
      '| features | 3: core, engineering, wiki | `nook features` |', '| tests | 560 in 64 files, 0 failures | `bun run check` |', '',
      '## Tests', '', '| Package | Tests | Files |', '|---|---|---|',
      '| core | 158 | 14 |', '| wiki | 21 | 2 |', '| total | 179 | 16 |', '',
      '## How it is built', '', drawnText('archDiagram'), '',
    ].join('\n'),
  )
})
afterEach(() => rmSync(docs, { recursive: true, force: true }))

describe('treeSpec', () => {
  test('nests each row under the row above it, and keeps the note', () => {
    expect(treeSpec('docs/\n├── a.md      the first page\n├── sub/\n│   └── b.md\n└── empty/\n')).toEqual({
      type: 'filetree',
      items: [{ name: 'docs/', children: [{ name: 'a.md', note: 'the first page' }, { name: 'sub/', children: [{ name: 'b.md' }] }, { name: 'empty/', icon: 'folder' }] }],
    })
  })

  test('keeps two top entries apart', () => {
    expect(treeSpec('docs/wiki/\n└── INDEX.md\ndocs/references/      the notes\n').items.map(i => i.name)).toEqual(['docs/wiki/', 'docs/references/'])
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
    expect(report).toContain('<span class="bn-stat__label">tests pass</span><span class="bn-stat__value">560</span>')
    expect(report).toContain('<mark>560 of 560 tests pass</mark>')
    expect(report).toContain('"rows":[{"label":"core","value":158},{"label":"wiki","value":21}]')
    expect(report).not.toContain('"label":"total"')
    expect(report).toContain('As of 17 Oct 2026')
  })

  test('puts an image of a chapter in the page, so the page stays one file', () => {
    mkdirSync(join(docs, 'guide', 'images'))
    writeFileSync(join(docs, 'guide', 'images', 'inbox.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    writeFileSync(join(docs, 'guide', '03-day.md'), '# 3. Chapter 3\n\n![The inbox](images/inbox.png)\n')
    const { guide } = buildPages(docs, '', new Date(2026, 9, 17))
    expect(guide).toContain('<figure class="shot card"><img src="data:image/png;base64,iVBORw==" alt="The inbox" loading="lazy"><figcaption>The inbox</figcaption></figure>')
  })

  test('points a chapter link at its section and the report link at the published report', () => {
    const { guide } = buildPages(docs, 'https://claude.ai/artifact/REPORT', new Date(2026, 9, 17))
    expect(guide).toContain('<a href="#ch-2">chapter 2</a>')
    expect(guide).toContain('<a href="https://claude.ai/artifact/REPORT" target="_blank" rel="noopener">the report</a>')
    expect(guide).toContain('the reference (<code>docs/reference/core.md</code>)')
    expect(guide).toContain('3 features: core, engineering, wiki')
  })
})

describe('the drawn diagrams', () => {
  test('match the docs of the repo', () => {
    expect(staleDiagrams(REPO_DOCS)).toEqual([])
  })

  test('stop the build when the doc text of a diagram changed, and name the diagram to redraw', () => {
    const work = join(docs, 'guide', '04-work.md')
    writeFileSync(work, readFileSync(work, 'utf8').replace('──▶ framing', '──▶ shaping'))
    expect(() => buildPages(docs)).toThrow('the block under "## The flow" of docs/guide/04-work.md changed')
    expect(() => buildPages(docs)).toThrow('redraw flowDiagram() in scripts/pages/build.ts')
  })

  test('stop the build when the doc drops the text of a diagram', () => {
    const work = join(docs, 'guide', '04-work.md')
    writeFileSync(work, readFileSync(work, 'utf8').replace(/## Pick a path[\s\S]*$/, '## Pick a path\n\nNo table now.\n'))
    expect(() => buildPages(docs)).toThrow('the table under "## Pick a path" of docs/guide/04-work.md has no table')
  })
})
