import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { readPage, readWiki } from '../src/read.ts'

let desk: string
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(desk, path)), { recursive: true })
  writeFileSync(join(desk, path), text)
}
beforeEach(() => {
  desk = realpathSync(mkdtempSync(join(tmpdir(), 'nook-wiki-read-')))
  write('nook.yml', 'packs: [wiki]\nwiki:\n  shelves:\n    - { name: ideas, use: "An idea that has not started." }\n    - { name: resources, use: "How a system works." }\n')
  write('docs/wiki/resources/INDEX.md', '# Resources\n\n| Page | Type | Summary |\n|---|---|---|\n| [cart.md](cart.md) | resource | How the cart keeps its lines. |\n')
  write('docs/wiki/resources/cart.md', '# Cart\n\nThe cart calls [[checkout]] and [the old page](missing.md).\n')
  write('docs/wiki/resources/checkout.md', '# Checkout\n')
  write('docs/wiki/drafts/export-retry.md', '# Export retry\n')
})
afterEach(() => rmSync(desk, { recursive: true, force: true }))

describe('readWiki', () => {
  test('gives each shelf with its use and the lines of its index, and the drafts that wait for a yes', () => {
    expect(readWiki(desk)).toEqual({
      dir: join(desk, 'docs/wiki'),
      shelves: [
        { name: 'ideas', use: 'An idea that has not started.', lines: [] },
        { name: 'resources', use: 'How a system works.', lines: [{ page: 'cart.md', type: 'resource', summary: 'How the cart keeps its lines.' }] },
      ],
      drafts: ['export-retry.md'],
    })
  })

  test('is null in a desk with no wiki', () => {
    write('nook.yml', 'packs: []\n')
    expect(readWiki(desk)).toBeNull()
  })
})

describe('readPage', () => {
  test('gives the text of a page and each link with the page that it reaches, or null when it reaches none', () => {
    expect(readPage(desk, 'resources/cart.md')).toEqual({
      path: 'resources/cart.md',
      text: '# Cart\n\nThe cart calls [[checkout]] and [the old page](missing.md).\n',
      links: [
        { link: '[[checkout]]', target: 'resources/checkout.md' },
        { link: 'missing.md', target: null },
      ],
    })
  })

  test('reads a draft too', () => {
    expect(readPage(desk, 'drafts/export-retry.md').text).toBe('# Export retry\n')
  })

  test.each(['../nook.yml', 'resources/../../nook.yml', 'resources/notes.txt', 'resources/none.md', 'resources/folder.md'])('refuses %s, which is no page', path => {
    write('docs/wiki/resources/notes.txt', 'text')
    mkdirSync(join(desk, 'docs/wiki/resources/folder.md'))
    expect(() => readPage(desk, path)).toThrow('is no page of the wiki')
  })

  test.each(['resources/.env.md', '.ssh/keys.md'])('refuses the secret file %s', path => {
    write(`docs/wiki/${path}`, 'TOKEN=x')
    expect(() => readPage(desk, path)).toThrow('is no page of the wiki')
  })

  test('refuses a page that is a link to a file outside the wiki', () => {
    write('outside/credentials.md', 'TOKEN=x')
    symlinkSync(join(desk, 'outside/credentials.md'), join(desk, 'docs/wiki/resources/key.md'))
    expect(() => readPage(desk, 'resources/key.md')).toThrow('is no page of the wiki')
  })

  test('reads a page whose name starts with two dots', () => {
    write('docs/wiki/..notes.md', '# Notes\n')
    expect(readPage(desk, '..notes.md').text).toBe('# Notes\n')
  })
})
