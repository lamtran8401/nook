import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { workspacePages, openCount } from '@/lib/workspace.ts'

let workspace: string
beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'nook-tabs-'))
})
afterEach(() => rmSync(workspace, { recursive: true, force: true }))

describe('workspacePages', () => {
  test('gives Home, then a page for each pack on in the workspace that has one', () => {
    writeFileSync(join(workspace, 'nook.yml'), 'engineering: {}\nwiki: {}\n')
    expect(workspacePages(workspace).map(page => [page.key, page.path])).toEqual([['home', ''], ['works', '/works'], ['wiki', '/wiki'], ['metrics', '/metrics'], ['agents', '/agents'], ['events', '/events'], ['harness', '/harness']])
  })

  test('gives Home and the pages of core in a workspace with no pack', () => {
    writeFileSync(join(workspace, 'nook.yml'), 'secrets: []\n')
    expect(workspacePages(workspace).map(page => page.key)).toEqual(['home', 'agents', 'events', 'harness'])
  })
})

describe('openCount', () => {
  test('a workspace whose ledger cannot be read gives no count, so the shell still shows and the page shows the gap', () => {
    writeFileSync(join(workspace, 'nook.yml'), 'engineering: {}\n')
    expect(openCount(workspace)).toBeUndefined()
  })
})
