import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { SearchResults } from '../components/SearchResults.tsx'
import { search } from '../lib/search.ts'
import { html, text } from './markup.ts'

let desk: string
const write = (rel: string, text: string) => {
  mkdirSync(dirname(join(desk, rel)), { recursive: true })
  writeFileSync(join(desk, rel), text)
}

beforeEach(() => {
  desk = realpathSync(mkdtempSync(join(tmpdir(), 'nook-search-')))
  write('nook.yml', 'packs: [engineering, wiki, learn]\nsecrets: [docs/wiki/resources/keys.md]\nwiki:\n  shelves:\n    - { name: resources, use: "how a system works" }\nlearn:\n  dir: learn\n')
  write('works/SHOP-42/plan.md', '# SHOP-42: the plan\n\n## Risks\n\nA payment retry that runs twice charges twice.\n')
  write('docs/wiki/resources/payment-vault.md', '# Payment vault\n\n## Retries\n\nThe vault takes a Payment Retry with a new key.\n')
  write('learn/english/mistakes.md', '# Mistakes\n\n| the payment retry are slow | agreement |\n')
})
afterEach(() => rmSync(desk, { recursive: true, force: true }))

describe('search', () => {
  test('finds each line with every word, in wiki pages, item documents and course files, with its heading and its page', () => {
    expect(search(desk, 'payment retry')).toEqual([
      { file: 'works/SHOP-42/plan.md', href: '/works/SHOP-42?tab=plan', heading: 'Risks', line: 5, text: 'A payment retry that runs twice charges twice.' },
      { file: 'docs/wiki/resources/payment-vault.md', href: '/wiki/resources/payment-vault.md', heading: 'Retries', line: 5, text: 'The vault takes a Payment Retry with a new key.' },
      { file: 'learn/english/mistakes.md', href: '/learn/english', heading: 'Mistakes', line: 3, text: '| the payment retry are slow | agreement |' },
    ])
  })

  test('reads the files again on each search, so a page changed a moment ago gives its new words', () => {
    expect(search(desk, 'refund rule')).toEqual([])
    write('works/SHOP-42/plan.md', '# SHOP-42: the plan\n\nThe refund rule waits for Q2.\n')
    expect(search(desk, 'refund rule').map(h => h.text)).toEqual(['The refund rule waits for Q2.'])
  })

  test('never reads a secret file: an env file, a file that nook.yml names, or a link to a file outside', () => {
    write('works/SHOP-42/.env', 'payment retry token=abc\n')
    write('docs/wiki/resources/keys.md', '# Keys\n\npayment retry key k-1\n')
    write('outside/notes.md', 'payment retry outside\n')
    symlinkSync(join(desk, 'outside', 'notes.md'), join(desk, 'docs', 'wiki', 'resources', 'linked.md'))
    expect(search(desk, 'payment retry').map(h => h.file)).toEqual(['works/SHOP-42/plan.md', 'docs/wiki/resources/payment-vault.md', 'learn/english/mistakes.md'])
  })

  test('gives nothing for an empty query', () => {
    expect(search(desk, '   ')).toEqual([])
  })
})

describe('SearchResults', () => {
  test('lists each line with its file and heading, as a link to its page', () => {
    const markup = html(<SearchResults query="payment retry" hits={[{ file: 'works/SHOP-42/plan.md', href: '/works/SHOP-42?tab=plan', heading: 'Risks', line: 5, text: 'A payment retry charges twice.' }]} />)
    expect(markup).toContain('<a href="/works/SHOP-42?tab=plan">A payment retry charges twice.</a>')
    expect(text(markup)).toBe('1 line holds "payment retry" L5 A payment retry charges twice. works/SHOP-42/plan.md · Risks')
  })

  test('says so when nothing holds the words', () => {
    expect(text(html(<SearchResults query="refund" hits={[]} />))).toBe('Nothing holds "refund" A line matches when it holds every word.')
  })
})
