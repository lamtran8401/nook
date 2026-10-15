import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Catalog } from '../src/catalog.ts'
import { Environment } from '../src/environment.ts'
import { KitConfig } from '../src/kit-config.ts'
import { activePacks } from '../src/packs.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'kit-env-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('KitConfig', () => {
  test('reads the two forms of packs, the rules, the secrets and a section of a pack', () => {
    const list = KitConfig.parse('packs: [a, b]\nsecrets: [x.yaml]\nengineering: { dir: work }\n', 'kit.yml')
    expect([list.packs, list.off, list.secrets]).toEqual([['a', 'b'], [], ['x.yaml']])
    expect(list.section('engineering')).toEqual({ dir: 'work' })
    const map = KitConfig.parse('packs: { on: [a], off: [b] }\nrules: { off: [writing] }\n', 'kit.yml')
    expect([map.packs, map.off, map.rules.off]).toEqual([['a'], ['b'], ['writing']])
  })

  test('a fault names the file and the key', () => {
    expect(() => KitConfig.parse('packs: [a', 'kit.yml')).toThrow('kit.yml is not valid YAML')
    expect(() => KitConfig.parse('- a\n', 'kit.yml')).toThrow('kit.yml must hold a map of keys')
    expect(() => KitConfig.parse('secrets: x\n', 'kit.yml')).toThrow('kit.yml: secrets must be a list of strings')
  })
})

describe('Environment', () => {
  test('the environments above a folder come outermost first; the nearest is the last', () => {
    const inner = join(root, 'company', 'projects', 'shop')
    mkdirSync(inner, { recursive: true })
    writeFileSync(join(root, 'kit.yml'), 'packs: []\n')
    writeFileSync(join(root, 'company', 'kit.yml'), 'packs: [engineering]\nsecrets: [infra.yaml]\n')
    expect(Environment.above(inner).map(e => e.dir)).toEqual([root, join(root, 'company')])
    expect(Environment.nearest(inner)?.dir).toBe(join(root, 'company'))
    expect(Environment.nearest(inner)?.secretFiles()).toEqual([join(root, 'company', 'infra.yaml')])
  })
})

describe('activePacks', () => {
  test('a pack flows down to every folder inside its environment, which holds its record', () => {
    const shop = join(root, 'projects', 'shop')
    mkdirSync(shop, { recursive: true })
    writeFileSync(join(root, 'kit.yml'), 'packs: [engineering, wiki]\n')
    expect(activePacks(shop).map(p => [p.name, p.home.dir])).toEqual([['engineering', root], ['wiki', root]])
  })

  test('a child turns a pack of a parent off, and naming a pack again makes the child its home', () => {
    const client = join(root, 'projects', 'client-x')
    mkdirSync(client, { recursive: true })
    writeFileSync(join(root, 'kit.yml'), 'packs: [engineering, wiki]\n')
    writeFileSync(join(client, 'kit.yml'), 'packs:\n  on: [engineering]\n  off: [wiki]\n')
    expect(activePacks(client).map(p => [p.name, p.home.dir])).toEqual([['engineering', client]])
  })
})

describe('Catalog', () => {
  test('the plugins of a project, by the name in pack.json; an unknown pack is an error that names it', () => {
    mkdirSync(join(root, 'plugins', 'core'), { recursive: true })
    mkdirSync(join(root, 'plugins', 'notes'), { recursive: true })
    writeFileSync(join(root, 'plugins', 'core', 'pack.json'), '{ "name": "core", "description": "d" }')
    const catalog = Catalog.load(root)
    expect(catalog.all().map(p => p.manifest.name)).toEqual(['core'])
    expect(catalog.dirOf('core')).toBe(join(root, 'plugins', 'core'))
    expect(() => catalog.dirOf('wiki')).toThrow('the kit project has no plugin for the pack wiki')
  })
})
