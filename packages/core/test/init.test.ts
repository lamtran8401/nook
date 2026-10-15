import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { activePacks, environmentsAbove, secretsAbove } from '@kit/env/env.ts'

import { doctor, formatDoctor } from '../src/doctor.ts'
import { addPacks, init, mergeSettings, placeBlock } from '../src/init.ts'

const coreDir = join(import.meta.dir, '..', '..', '..', 'plugins', 'core')
let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'kit-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const run = (dir: string, packs: string[] = [], update = false) => init({ dir, packs, update, coreDir })

describe('E-01 init with no pack', () => {
  test('writes kit.yml, the block, the three rules, the style, the settings and .kit, and keeps the owner text', () => {
    mkdirSync(root, { recursive: true })
    writeFileSync(join(root, 'CLAUDE.md'), '# Mine\n\nI write in Vietnamese.\n')
    const report = run(root)
    expect(report.packs).toEqual(['core'])
    expect(existsSync(join(root, 'kit.yml'))).toBe(true)
    const claude = readFileSync(join(root, 'CLAUDE.md'), 'utf8')
    expect(claude.startsWith('# Mine\n\nI write in Vietnamese.\n')).toBe(true)
    expect(claude).toContain('<!-- kit:begin -->')
    expect(claude).toContain('Packs on here: core.')
    for (const rule of ['writing', 'safety', 'questions']) expect(existsSync(join(root, '.claude', 'rules', 'kit', `${rule}.md`))).toBe(true)
    expect(existsSync(join(root, '.claude', 'output-styles', 'kit-companion.md'))).toBe(true)
    expect(existsSync(join(root, '.kit'))).toBe(true)
    const settings = JSON.parse(readFileSync(join(root, '.claude', 'settings.json'), 'utf8'))
    expect(settings.permissions.deny).toContain('Edit(.kit/**)')
    expect(settings.outputStyle).toBe('kit-companion')
  })

  test('a second run changes nothing', () => {
    run(root)
    const before = readFileSync(join(root, 'CLAUDE.md'), 'utf8')
    const report = run(root)
    expect(report.wrote).toEqual([])
    expect(readFileSync(join(root, 'CLAUDE.md'), 'utf8')).toBe(before)
  })

  test('a rule turned off in kit.yml is not written, and goes away on update', () => {
    run(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: []\nrules: { off: [writing] }\n')
    run(root, [], true)
    expect(existsSync(join(root, '.claude', 'rules', 'kit', 'writing.md'))).toBe(false)
    expect(existsSync(join(root, '.claude', 'rules', 'kit', 'safety.md'))).toBe(true)
  })
})

describe('E-02 init with packs', () => {
  test('a pack that the kit does not ship is refused', () => {
    expect(() => run(root, ['nope'])).toThrow(/no pack is named "nope"/)
  })

  test('core is always on and is not written twice', () => {
    const report = run(root, ['core'])
    expect(report.packs).toEqual(['core'])
    expect(readFileSync(join(root, 'kit.yml'), 'utf8')).toContain('packs: []')
  })
})

describe('E-03 update keeps what is yours', () => {
  test('the owner edits CLAUDE.md and adds a rule; update touches only the kit parts', () => {
    run(root)
    const claude = join(root, 'CLAUDE.md')
    writeFileSync(claude, `${readFileSync(claude, 'utf8')}\n## My notes\n\nThe bff is the API.\n`)
    writeFileSync(join(root, '.claude', 'rules', 'my-style.md'), '# Mine\n')
    const settingsFile = join(root, '.claude', 'settings.json')
    const settings = JSON.parse(readFileSync(settingsFile, 'utf8'))
    settings.permissions.allow.push('Bash(make *)')
    settings.theme = 'dark'
    writeFileSync(settingsFile, JSON.stringify(settings, null, 2))
    const before = readFileSync(claude, 'utf8')
    // the kit changes its template: the block text must change, the rest must not
    run(root, [], true)
    const after = readFileSync(claude, 'utf8')
    expect(after.slice(0, before.indexOf('<!-- kit:begin -->'))).toBe(before.slice(0, before.indexOf('<!-- kit:begin -->')))
    expect(after).toContain('## My notes\n\nThe bff is the API.')
    expect(existsSync(join(root, '.claude', 'rules', 'my-style.md'))).toBe(true)
    const merged = JSON.parse(readFileSync(settingsFile, 'utf8'))
    expect(merged.permissions.allow).toContain('Bash(make *)')
    expect(merged.theme).toBe('dark')
    expect(merged.outputStyle).toBe('kit-companion')
  })

  test('placeBlock replaces the block in place only on update', () => {
    const text = 'head\n\n<!-- kit:begin -->\nold\n<!-- kit:end -->\n\ntail\n'
    expect(placeBlock(text, '<!-- kit:begin -->\nnew\n<!-- kit:end -->', false)).toBe(text)
    expect(placeBlock(text, '<!-- kit:begin -->\nnew\n<!-- kit:end -->', true)).toBe('head\n\n<!-- kit:begin -->\nnew\n<!-- kit:end -->\n\ntail\n')
    expect(placeBlock('', 'B', true)).toBe('B\n')
  })

  test('mergeSettings joins lists with no doubles and keeps the owner keys', () => {
    const merged = mergeSettings({ permissions: { allow: ['a'] }, theme: 'dark' }, { permissions: { allow: ['a', 'b'], deny: ['c'] }, outputStyle: 'x', theme: 'light' })
    expect(merged).toEqual({ permissions: { allow: ['a', 'b'], ask: [], deny: ['c'] }, theme: 'dark', outputStyle: 'x' })
    const env = mergeSettings(mergeSettings({ env: { MINE: '1' } }, { env: { A: '1', MINE: '2' } }), { env: { B: '1' } })
    expect(env.env).toEqual({ A: '1', MINE: '1', B: '1' })
  })

  test('addPacks changes only the packs line', () => {
    expect(addPacks('# note\npacks: [a]\nrules: { off: [] }\n', ['b'])).toBe('# note\npacks: [a, b]\nrules: { off: [] }\n')
    expect(addPacks('packs: []\n', ['b'])).toBe('packs: [b]\n')
  })
})

describe('E-02b, E-02c environments nest', () => {
  test('packs flow down, a child can turn one off, and the nearest init is the home of the record', () => {
    const company = join(root, 'company')
    const space = join(company, 'spaces', 'shop')
    const client = join(company, 'spaces', 'client-x')
    mkdirSync(space, { recursive: true })
    mkdirSync(client, { recursive: true })
    run(root)
    run(company)
    writeFileSync(join(company, 'kit.yml'), 'packs: [core]\n')
    writeFileSync(join(root, 'kit.yml'), 'packs: []\n')
    // simulate packs that exist by name: core only ships now, so use the config model directly
    writeFileSync(join(company, 'kit.yml'), 'packs: [engineering, wiki]\nsecrets: [config/infra.local.yaml]\n')
    writeFileSync(join(client, 'kit.yml'), 'packs:\n  on: [engineering]\n  off: [wiki]\n')
    expect(environmentsAbove(space).map(e => e.dir)).toEqual([root, company])
    const inSpace = activePacks(space)
    expect(inSpace.map(p => [p.name, p.home.dir])).toEqual([['engineering', company], ['wiki', company]])
    const inClient = activePacks(client)
    expect(inClient.map(p => [p.name, p.home.dir])).toEqual([['engineering', client]])
    expect(secretsAbove(space)).toEqual([join(company, 'config/infra.local.yaml')])
  })
})

describe('E-05 doctor', () => {
  test('outside an environment: one error with the fix', () => {
    const report = doctor(root, coreDir)
    expect(report.findings[0]?.level).toBe('error')
    expect(report.findings[0]?.fix).toContain('kit init')
  })

  test('the report names core on every environment line', () => {
    run(root)
    const text = formatDoctor(doctor(root, coreDir), root)
    expect(text).toContain('packs: core')
    expect(text).not.toContain('words only')
  })

  test('a healthy folder: no gap; a conflicting rule and a missing pack: gaps with fixes', () => {
    run(root)
    expect(doctor(root, coreDir).findings.map(f => f.level)).toEqual(['ok'])
    writeFileSync(join(root, '.claude', 'rules', 'writing.md'), '# mine\n')
    writeFileSync(join(root, 'kit.yml'), 'packs: [ghost]\n')
    const report = doctor(root, coreDir)
    const texts = report.findings.map(f => f.text)
    expect(texts.some(t => t.includes('two rules named "writing"'))).toBe(true)
    expect(texts.some(t => t.includes('does not exist: ghost'))).toBe(true)
    expect(report.findings.every(f => f.fix)).toBe(true)
  })
})
