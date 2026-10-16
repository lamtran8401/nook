import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { wikiModule } from '../src/module.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'kit-wiki-module-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const SECTION = 'wiki:\n  shelves:\n    - { name: ideas, use: "An idea." }\n    - { name: daily, use: "A day.", index: false }\n'

describe('wikiModule', () => {
  test('with no wiki section, the pack is not configured and the doctor adds no wiki gap', () => {
    writeFileSync(join(root, 'kit.yml'), 'packs: [wiki]\n')
    expect([wikiModule.configured(root), wikiModule.doctor(root)]).toEqual([false, []])
  })

  test('setup makes the wiki, the references and each shelf that is missing', () => {
    writeFileSync(join(root, 'kit.yml'), `packs: [wiki]\n${SECTION}`)
    expect(wikiModule.setup(root)).toEqual(['docs/wiki/', 'docs/references/', 'docs/wiki/ideas/', 'docs/wiki/daily/'])
    expect(existsSync(join(root, 'docs/wiki/daily'))).toBe(true)
  })

  test('the doctor names the gaps of the indexes', () => {
    writeFileSync(join(root, 'kit.yml'), `packs: [wiki]\n${SECTION}`)
    wikiModule.setup(root)
    expect(wikiModule.doctor(root).map(f => f.text)).toEqual(['docs/wiki/INDEX.md is missing', 'ideas/INDEX.md is missing'])
  })

  test('a folder that does not turn the wiki on gets no setup', () => {
    writeFileSync(join(root, 'kit.yml'), 'packs: []\n')
    expect(wikiModule.setup(root)).toEqual([])
  })
})
