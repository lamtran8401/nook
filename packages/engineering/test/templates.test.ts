import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { fill, Templates } from '../src/documents/templates.ts'
import { WorkFolder } from '../src/documents/work-folder.ts'

const TEMPLATES = join(import.meta.dir, '..', '..', '..', 'plugins', 'engineering', 'templates')
const ITEM = { id: 'SHOP-12', title: 'Filter by status', kind: 'feature', size: 'M', areas: ['bff', 'web'] }

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'kit-templates-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const scaffold = (doc: 'spec.md' | 'plan.md' | 'tasks.md', item = ITEM) => {
  const folder = new WorkFolder(join(dir, item.id))
  new Templates(TEMPLATES, () => '2026-10-15').scaffold(folder, item, doc)
  return readFileSync(folder.path(doc), 'utf8')
}

describe('fill', () => {
  test('puts the fields of the item and the date in place of the marks', () => {
    const text = fill('{{id}} {{title}} {{kind}} {{size}} {{areas}} {{today}}', ITEM, '2026-10-15')
    expect(text).toBe('SHOP-12 Filter by status feature M [bff, web] 2026-10-15')
  })

  test('drops the Flow of a plan that is not size L', () => {
    expect(fill('## Proof\n\nx\n\n## Flow\n\ny\n\n## Risks\n\nz\n', ITEM, '2026-10-15')).toBe('## Proof\n\nx\n\n## Risks\n\nz\n')
  })

  test('keeps the Flow of a plan of size L', () => {
    expect(fill('## Flow\n\ny\n', { ...ITEM, size: 'L' }, '2026-10-15')).toBe('## Flow\n\ny\n')
  })
})

describe('Templates.scaffold', () => {
  test('spec.md has the front matter with both dates, the In short guidance and the new sections', () => {
    const spec = scaffold('spec.md')
    expect(spec.startsWith('---\nid: SHOP-12\nkind: feature\nsize: M\nareas: [bff, web]\ncreated: 2026-10-15\nupdated: 2026-10-15\n---\n\n# SHOP-12: Filter by status\n')).toBe(true)
    expect(spec.match(/^## .*$/gm)).toEqual(['## Why', '## What changes', '## Acceptance criteria', '## Decisions', '## Out of scope'])
  })

  test('the spec of an investigation has Questions in place of the criteria', () => {
    const spec = scaffold('spec.md', { ...ITEM, kind: 'investigate' })
    expect(spec.match(/^## .*$/gm)).toEqual(['## Why', '## What changes', '## Questions', '## Decisions', '## Out of scope'])
  })

  test('plan.md of size M has both dates and no Flow', () => {
    const plan = scaffold('plan.md')
    expect(plan.startsWith('---\nid: SHOP-12\napproach: \ncreated: 2026-10-15\nupdated: 2026-10-15\n---\n\n# SHOP-12: the plan\n')).toBe(true)
    expect(plan.match(/^## .*$/gm)).toEqual(['## Today', '## Approach', '## Impact', '## Proof', '## Risks'])
  })

  test('plan.md of size L has the Flow before the Proof', () => {
    const plan = scaffold('plan.md', { ...ITEM, size: 'L' })
    expect(plan.match(/^## .*$/gm)).toEqual(['## Today', '## Approach', '## Impact', '## Flow', '## Proof', '## Risks'])
  })

  test('tasks.md has both dates and a slice with a files line', () => {
    const tasks = scaffold('tasks.md')
    expect(tasks.startsWith('---\nid: SHOP-12\ncreated: 2026-10-15\nupdated: 2026-10-15\n---\n\n# SHOP-12: the slices\n')).toBe(true)
    expect(tasks).toContain('- files: \n')
  })
})
