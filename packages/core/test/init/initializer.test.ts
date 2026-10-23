import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { FeatureModule } from '@nook/desk/desks.ts'
import { DeskList } from '@nook/desk/desk-list.ts'

import { init } from '../../src/init/initializer.ts'
import { initIn, PLUGIN_DIR, removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir()
})
afterEach(() => removeDir(root))

const readText = (rel: string) => readFileSync(join(root, rel), 'utf8')
const readJson = (rel: string) => JSON.parse(readText(rel))
const nookRules = () => readdirSync(join(root, '.claude', 'rules', 'nook')).sort()

describe('Initializer', () => {
  test('a first init writes nook.yml, .nook, the CLAUDE.md block, the five base rules, the style and the settings', () => {
    expect(initIn(root).wrote).toEqual([
      'nook.yml',
      '.nook/',
      'CLAUDE.md (the nook block)',
      '.claude/rules/nook/writing.md',
      '.claude/rules/nook/safety.md',
      '.claude/rules/nook/questions.md',
      '.claude/rules/nook/approach.md',
      '.claude/rules/nook/comments.md',
      '.claude/output-styles/nook-companion.md',
      '.claude/settings.json (the nook keys)',
    ])
  })

  test('the block names the features that are on', () => {
    initIn(root)
    expect(readText('CLAUDE.md')).toContain('Features on here: core.')
  })

  test('the text that the owner wrote in CLAUDE.md stays above the block', () => {
    writeFileSync(join(root, 'CLAUDE.md'), '# Mine\n\nI write in Vietnamese.\n')
    initIn(root)
    expect(readText('CLAUDE.md').startsWith('# Mine\n\nI write in Vietnamese.\n\n<!-- nook:begin -->')).toBe(true)
  })

  test('the settings deny an edit of .nook and set the companion style', () => {
    initIn(root)
    const settings = readJson('.claude/settings.json')
    expect(settings.permissions.deny).toContain('Edit(.nook/**)')
    expect(settings.outputStyle).toBe('nook-companion')
  })

  test('a second run writes nothing', () => {
    initIn(root)
    expect(initIn(root).wrote).toEqual([])
  })

  test('a rule turned off in nook.yml goes away on update, and the other rules stay', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'rules: { off: [writing] }\n')
    expect(initIn(root, [], true).wrote).toEqual(['.claude/rules/nook/writing.md (removed)'])
    expect(nookRules()).toEqual(['approach.md', 'comments.md', 'questions.md', 'safety.md'])
  })

  test('a feature that Nook does not have is refused', () => {
    expect(() => initIn(root, ['nope'])).toThrow('no feature is named "nope"')
  })

  test('core is always on, so naming it writes no section', () => {
    expect(initIn(root, ['core']).features).toEqual(['core'])
    expect(readText('nook.yml')).not.toContain('core:')
  })

  test('a feature named on a second init gets an empty section, and its rules keep their own file names', () => {
    initIn(root)
    expect(initIn(root, ['engineering']).features).toEqual(['core', 'engineering'])
    expect(readText('nook.yml').endsWith('\nengineering: {}\n')).toBe(true)
    expect(nookRules()).toEqual(['approach.md', 'comments.md', 'engineering.md', 'questions.md', 'safety.md', 'testing.md', 'writing.md'])
  })

  test('an update keeps the notes, the rules and the settings keys of the owner', () => {
    initIn(root)
    writeFileSync(join(root, 'CLAUDE.md'), `${readText('CLAUDE.md')}\n## My notes\n\nThe bff is the API.\n`)
    writeFileSync(join(root, '.claude', 'rules', 'my-style.md'), '# Mine\n')
    const settings = readJson('.claude/settings.json')
    settings.permissions.allow.push('Bash(make *)')
    settings.theme = 'dark'
    writeFileSync(join(root, '.claude', 'settings.json'), JSON.stringify(settings, null, 2))
    initIn(root, [], true)
    const merged = readJson('.claude/settings.json')
    expect(readText('CLAUDE.md')).toContain('## My notes\n\nThe bff is the API.\n')
    expect(existsSync(join(root, '.claude', 'rules', 'my-style.md'))).toBe(true)
    expect([merged.permissions.allow.includes('Bash(make *)'), merged.theme]).toEqual([true, 'dark'])
  })
})

describe('Initializer: the list of desks', () => {
  test('init adds its folder to the list of the owner, once', () => {
    const list = new DeskList(join(root, 'home', '.config', 'nook', 'desks'))
    init({ dir: root, with: [], update: false, pluginDir: PLUGIN_DIR, list })
    init({ dir: root, with: [], update: true, pluginDir: PLUGIN_DIR, list })
    expect(list.dirs()).toEqual([root])
  })
})

describe('Initializer: the features on here', () => {
  const calls: string[] = []
  const feature = (configured: boolean): FeatureModule => ({
    name: 'engineering',
    setup: dir => (calls.push(dir), ['works/']),
    configured: () => configured,
    doctor: () => [],
  })
  const initWith = (module: FeatureModule, features: string[]) => init({ dir: root, with: features, update: false, pluginDir: PLUGIN_DIR, modules: [module] })

  test('runs the setup of each feature on here and reports what it made', () => {
    calls.length = 0
    expect(initWith(feature(true), ['engineering']).wrote.at(-1)).toBe('works/')
    expect(calls).toEqual([root])
  })

  test('names a feature whose section /setup has not filled in yet', () => {
    expect(initWith(feature(false), ['engineering']).unset).toEqual(['engineering'])
  })

  test('does not set up a feature that is not on here', () => {
    calls.length = 0
    expect(initWith(feature(false), []).unset).toEqual([])
    expect(calls).toEqual([])
  })
})
