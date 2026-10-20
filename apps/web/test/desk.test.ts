import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { deskPages, openCount } from '@/lib/desk.ts'

let desk: string
beforeEach(() => {
  desk = mkdtempSync(join(tmpdir(), 'nook-tabs-'))
})
afterEach(() => rmSync(desk, { recursive: true, force: true }))

describe('deskPages', () => {
  test('gives Home, then a page for each pack on in the desk that has one', () => {
    writeFileSync(join(desk, 'nook.yml'), 'packs: [engineering, learn]\n')
    expect(deskPages(desk).map(page => [page.key, page.path])).toEqual([['home', ''], ['works', '/works'], ['learn', '/learn']])
  })

  test('gives only Home in a desk with no pack', () => {
    writeFileSync(join(desk, 'nook.yml'), 'packs: []\n')
    expect(deskPages(desk).map(page => page.key)).toEqual(['home'])
  })
})

describe('openCount', () => {
  test('a desk whose ledger cannot be read gives no count, so the shell still shows and the page shows the gap', () => {
    writeFileSync(join(desk, 'nook.yml'), 'packs: [engineering]\n')
    expect(openCount(desk)).toBeUndefined()
  })
})
