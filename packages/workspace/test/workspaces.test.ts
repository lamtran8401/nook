import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Workspace } from '../src/workspace.ts'
import { activeFeatures, featuresHere, pluginId } from '../src/features.ts'
import { NookConfig } from '../src/nook-config.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-env-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('NookConfig', () => {
  test('reads the rules, the secrets and the section of a feature', () => {
    const config = NookConfig.parse('secrets: [x.yaml]\nrules: { off: [writing] }\nengineering: { dir: work }\n', 'nook.yml')
    expect([config.secrets, config.rules.off]).toEqual([['x.yaml'], ['writing']])
    expect(config.section('engineering')).toEqual({ dir: 'work' })
  })

  test('a key with no value still counts as the section of a feature', () => {
    const config = NookConfig.parse('wiki:\nengineering: {}\n', 'nook.yml')
    expect([config.has('wiki'), config.has('engineering'), config.has('issue-tracker')]).toEqual([true, true, false])
  })

  test('names the retired keys that the file still has', () => {
    expect(NookConfig.parse('packs: [engineering]\nlearn:\n  dir: learn\nwiki: {}\n', 'nook.yml').retired()).toEqual(['packs', 'learn'])
    expect(NookConfig.parse('wiki: {}\n', 'nook.yml').retired()).toEqual([])
  })

  test('a fault names the file and the key', () => {
    expect(() => NookConfig.parse('secrets: [a', 'nook.yml')).toThrow('nook.yml is not valid YAML')
    expect(() => NookConfig.parse('- a\n', 'nook.yml')).toThrow('nook.yml must hold a map of keys')
    expect(() => NookConfig.parse('secrets: x\n', 'nook.yml')).toThrow('nook.yml: secrets must be a list of strings')
  })
})

describe('Workspace', () => {
  test('the workspaces above a folder come outermost first; the nearest is the last', () => {
    const inner = join(root, 'company', 'projects', 'shop')
    mkdirSync(inner, { recursive: true })
    writeFileSync(join(root, 'nook.yml'), 'secrets: []\n')
    writeFileSync(join(root, 'company', 'nook.yml'), 'engineering: {}\nsecrets: [infra.yaml]\n')
    expect(Workspace.above(inner).map(workspace => workspace.dir)).toEqual([root, join(root, 'company')])
    expect(Workspace.nearest(inner)?.dir).toBe(join(root, 'company'))
    expect(Workspace.nearest(inner)?.secretFiles()).toEqual([join(root, 'company', 'infra.yaml')])
  })
})

describe('activeFeatures', () => {
  test('core and each feature with a section flow down to every folder inside the workspace, which holds their record', () => {
    const shop = join(root, 'projects', 'shop')
    mkdirSync(shop, { recursive: true })
    writeFileSync(join(root, 'nook.yml'), 'engineering: {}\nwiki: {}\n')
    expect(activeFeatures(shop).map(f => [f.name, f.home.dir])).toEqual([['core', root], ['engineering', root], ['wiki', root]])
  })

  test('a child with its own section becomes the home of the feature; a feature with no section above is off', () => {
    const client = join(root, 'projects', 'client-x')
    mkdirSync(client, { recursive: true })
    writeFileSync(join(root, 'nook.yml'), 'engineering: {}\n')
    writeFileSync(join(client, 'nook.yml'), 'engineering:\n  dir: works\n')
    expect(activeFeatures(client).map(f => [f.name, f.home.dir])).toEqual([['core', root], ['engineering', client]])
  })

  test('a child with no section of its own gets the feature of its parent', () => {
    const child = join(root, 'shop')
    mkdirSync(child, { recursive: true })
    writeFileSync(join(root, 'nook.yml'), 'engineering: {}\n')
    writeFileSync(join(child, 'nook.yml'), 'secrets: []\n')
    expect(activeFeatures(child).find(f => f.name === 'engineering')?.home.dir).toBe(root)
    expect(featuresHere(Workspace.read(child)).map(f => f.name)).toEqual(['core'])
  })

  test('outside every workspace no feature is on', () => {
    expect(activeFeatures(root)).toEqual([])
  })
})

describe('pluginId', () => {
  test('joins the name of the plugin and the name of the marketplace', () => {
    mkdirSync(join(root, 'plugin', '.claude-plugin'), { recursive: true })
    mkdirSync(join(root, '.claude-plugin'), { recursive: true })
    writeFileSync(join(root, 'plugin', '.claude-plugin', 'plugin.json'), '{ "name": "nook" }')
    writeFileSync(join(root, '.claude-plugin', 'marketplace.json'), '{ "name": "shelf" }')
    expect(pluginId(root)).toBe('nook@shelf')
  })
})
