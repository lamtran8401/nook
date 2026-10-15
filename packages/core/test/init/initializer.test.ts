import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir()
})
afterEach(() => removeDir(root))

const readText = (rel: string) => readFileSync(join(root, rel), 'utf8')
const readJson = (rel: string) => JSON.parse(readText(rel))
const kitRules = () => readdirSync(join(root, '.claude', 'rules', 'kit')).sort()

describe('Initializer', () => {
  test('a first init writes kit.yml, .kit, the CLAUDE.md block, the three base rules, the style and the settings', () => {
    expect(initIn(root).wrote).toEqual([
      'kit.yml',
      '.kit/',
      'CLAUDE.md (the kit block)',
      '.claude/rules/kit/writing.md',
      '.claude/rules/kit/safety.md',
      '.claude/rules/kit/questions.md',
      '.claude/output-styles/kit-companion.md',
      '.claude/settings.json (the kit keys)',
    ])
  })

  test('the block names the packs that are on', () => {
    initIn(root)
    expect(readText('CLAUDE.md')).toContain('Packs on here: core.')
  })

  test('the text that the owner wrote in CLAUDE.md stays above the block', () => {
    writeFileSync(join(root, 'CLAUDE.md'), '# Mine\n\nI write in Vietnamese.\n')
    initIn(root)
    expect(readText('CLAUDE.md').startsWith('# Mine\n\nI write in Vietnamese.\n\n<!-- kit:begin -->')).toBe(true)
  })

  test('the settings deny an edit of .kit and set the companion style', () => {
    initIn(root)
    const settings = readJson('.claude/settings.json')
    expect(settings.permissions.deny).toContain('Edit(.kit/**)')
    expect(settings.outputStyle).toBe('kit-companion')
  })

  test('a second run writes nothing', () => {
    initIn(root)
    expect(initIn(root).wrote).toEqual([])
  })

  test('a rule turned off in kit.yml goes away on update, and the other rules stay', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: []\nrules: { off: [writing] }\n')
    expect(initIn(root, [], true).wrote).toEqual(['.claude/rules/kit/writing.md (removed)'])
    expect(kitRules()).toEqual(['questions.md', 'safety.md'])
  })

  test('a pack that the kit does not ship is refused', () => {
    expect(() => initIn(root, ['nope'])).toThrow('no pack is named "nope"')
  })

  test('core is always on, so naming it writes an empty pack list', () => {
    expect(initIn(root, ['core']).packs).toEqual(['core'])
    expect(readText('kit.yml')).toContain('packs: []\n')
  })

  test('a pack named on a second init goes into kit.yml, and its rules keep their own file names', () => {
    initIn(root)
    expect(initIn(root, ['engineering']).packs).toEqual(['core', 'engineering'])
    expect(readText('kit.yml')).toContain('packs: [engineering]\n')
    expect(kitRules()).toEqual(['engineering.md', 'questions.md', 'safety.md', 'testing.md', 'writing.md'])
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
