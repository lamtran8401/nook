import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { doctor } from '../../src/doctor/doctor.ts'
import { claudeDirWith, initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir()
})
afterEach(() => removeDir(root))

const write = (rel: string, text: string) => {
  mkdirSync(join(root, rel, '..'), { recursive: true })
  writeFileSync(join(root, rel), text)
}
const readText = (rel: string) => readFileSync(join(root, rel), 'utf8')
const has = (rel: string) => existsSync(join(root, rel))

/** An environment as `kit init` left it, with lines of the owner in each file. */
function oldEnvironment(): void {
  write('kit.yml', 'packs: []\n# my note\nsecrets: []\n')
  write('.kit/engineering.db', 'the ledger')
  write('.claude/rules/kit/safety.md', '# Safety\n')
  write('.claude/output-styles/kit-companion.md', 'old style\n')
  write('CLAUDE.md', '# Mine\n\n<!-- kit:begin -->\n## Harness Kit\nold block\n<!-- kit:end -->\n')
  write(
    '.claude/settings.json',
    JSON.stringify({
      model: 'opus',
      outputStyle: 'kit-companion',
      permissions: { allow: ['Bash(kit *)', 'Bash(npm test)'], deny: ['Edit(.kit/**)', 'Bash(kit eng item approve *)'] },
    }),
  )
}

describe('the move from the old names', () => {
  test('init --update moves the config and the state folder, and keeps their content', () => {
    oldEnvironment()
    initIn(root, [], true)
    expect(has('kit.yml')).toBe(false)
    expect(readText('nook.yml')).toBe('packs: []\n# my note\nsecrets: []\n')
    expect(has('.kit')).toBe(false)
    expect(readText('.nook/engineering.db')).toBe('the ledger')
  })

  test('the old rules folder and the old style go; the new ones are written', () => {
    oldEnvironment()
    initIn(root, [], true)
    expect(has('.claude/rules/kit')).toBe(false)
    expect(has('.claude/output-styles/kit-companion.md')).toBe(false)
    expect(has('.claude/rules/nook/safety.md')).toBe(true)
    expect(has('.claude/output-styles/nook-companion.md')).toBe(true)
  })

  test('CLAUDE.md keeps the lines of the owner and has one block, under the new markers', () => {
    oldEnvironment()
    initIn(root, [], true)
    const text = readText('CLAUDE.md')
    expect(text.startsWith('# Mine\n\n<!-- nook:begin -->')).toBe(true)
    expect(text).not.toContain('kit:begin')
    expect(text).not.toContain('old block')
    expect(text.match(/nook:begin/g)?.length).toBe(1)
  })

  test('the settings name nook in place of kit, and keep the keys of the owner', () => {
    oldEnvironment()
    initIn(root, [], true)
    const settings = JSON.parse(readText('.claude/settings.json'))
    expect(settings.model).toBe('opus')
    expect(settings.outputStyle).toBe('nook-companion')
    expect(settings.permissions.allow).toContain('Bash(nook *)')
    expect(settings.permissions.allow).toContain('Bash(npm test)')
    expect(settings.permissions.allow).not.toContain('Bash(kit *)')
    expect(settings.permissions.deny).toContain('Edit(.nook/**)')
    expect(settings.permissions.deny).toContain('Bash(nook eng item approve *)')
    expect(JSON.stringify(settings)).not.toMatch(/\bkit\b/)
  })

  test('the report names each move', () => {
    oldEnvironment()
    const wrote = initIn(root, [], true).wrote
    expect(wrote).toContain('kit.yml → nook.yml')
    expect(wrote).toContain('.kit/ → .nook/')
    expect(wrote).toContain('.claude/rules/kit/ (removed)')
  })

  test('a plain init moves the old names too, so it never makes a second config', () => {
    oldEnvironment()
    initIn(root)
    expect(has('kit.yml')).toBe(false)
    expect(readText('nook.yml')).toContain('# my note')
    expect(readText('CLAUDE.md')).not.toContain('old block')
  })

  test('both kit.yml and nook.yml: the init stops, names both, and moves nothing', () => {
    oldEnvironment()
    write('nook.yml', 'packs: []\n')
    expect(() => initIn(root, [], true)).toThrow('both kit.yml and nook.yml')
    expect(readText('kit.yml')).toContain('# my note')
    expect(has('.kit/engineering.db')).toBe(true)
  })

  test('a second update after the move moves nothing', () => {
    oldEnvironment()
    const moves = (wrote: string[]) => wrote.filter(line => line.includes('→') || line.includes('removed'))
    expect(moves(initIn(root, [], true).wrote).length).toBeGreaterThan(0)
    expect(moves(initIn(root, [], true).wrote)).toEqual([])
  })
})

describe('Doctor: an environment of the old name', () => {
  test('it names the folder and the fix to update', () => {
    oldEnvironment()
    const claudeDir = claudeDirWith(root, ['nook@nook'])
    expect(doctor(root, { claudeDir }).findings).toEqual([
      { level: 'error', where: root, text: 'an environment of the old name kit: kit.yml is here, nook.yml is not', fix: `close Claude Code here, then run \`nook init --update\` in ${root}` },
    ])
  })
})
