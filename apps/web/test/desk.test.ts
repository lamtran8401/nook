import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { packTabs } from '../lib/desk.ts'

let desk: string
beforeEach(() => {
  desk = mkdtempSync(join(tmpdir(), 'nook-tabs-'))
})
afterEach(() => rmSync(desk, { recursive: true, force: true }))

describe('packTabs', () => {
  test('gives Home, then a tab for each pack on in the desk that has a page', () => {
    writeFileSync(join(desk, 'nook.yml'), 'packs: [engineering, learn]\n')
    expect(packTabs(desk)).toEqual([
      { href: '/', label: 'Home' },
      { href: '/works', label: 'Works' },
      { href: '/learn', label: 'Learn' },
    ])
  })

  test('gives only Home in a desk with no pack', () => {
    writeFileSync(join(desk, 'nook.yml'), 'packs: []\n')
    expect(packTabs(desk)).toEqual([{ href: '/', label: 'Home' }])
  })
})
