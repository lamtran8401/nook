import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { PackModule } from '@kit/env/env.ts'

import { doctor } from '../../src/doctor/doctor.ts'
import { formatDoctor } from '../../src/doctor/format.ts'
import { claudeDirWith, initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
let claudeDir: string
beforeEach(() => {
  root = tempDir()
  claudeDir = claudeDirWith(root, ['kit@harness-kit', 'kit-engineering@harness-kit'])
})
afterEach(() => removeDir(root))

const report = (modules: PackModule[] = []) => doctor(root, { claudeDir, modules })
const texts = (modules: PackModule[] = []) => report(modules).findings.map(f => f.text)

/** A pack module that reports one gap, or none. */
const fakePack = (gap: boolean): PackModule => ({
  name: 'engineering',
  setup: () => [],
  configured: () => !gap,
  doctor: dir => [gap ? { level: 'warn', where: dir, text: 'work/ is missing', fix: 'kit init --update' } : { level: 'ok', where: dir, text: 'no gap' }],
})

describe('Doctor', () => {
  test('outside an environment it reports one error with the fix to init', () => {
    expect(report().findings).toEqual([
      { level: 'error', where: root, text: 'not inside an environment: no kit.yml here or above', fix: 'run `kit init` in this folder or in one above it' },
    ])
  })

  test('a fresh environment with its plugin on has no gap', () => {
    initIn(root)
    expect(texts()).toEqual(['1 environment above, 1 packs on, no gap'])
  })

  test('a rule of the owner with the name of a base rule is a gap with the fix to turn one off', () => {
    initIn(root)
    writeFileSync(join(root, '.claude', 'rules', 'writing.md'), '# mine\n')
    expect(report().findings).toEqual([
      { level: 'warn', where: root, text: 'two rules named "writing": yours and the kit\'s; Claude can follow either', fix: 'turn the kit rule off (rules: { off: [writing] }) or rename yours' },
    ])
  })

  test('a pack that the kit does not ship is an error', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: [ghost]\n')
    expect(texts()).toContain('kit.yml names a pack that does not exist: ghost')
  })

  test('a secret of kit.yml that is not on disk is a gap', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: []\nsecrets: [config/gone.yaml]\n')
    expect(texts()).toEqual(['a secret of kit.yml does not exist: config/gone.yaml'])
  })

  test('an empty packs key is a gap', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs:\n')
    expect(texts()).toEqual(['kit.yml has an empty `packs:` key'])
  })
})

describe('Doctor: the plugins of Claude Code', () => {
  test('a plugin that the user settings do not turn on is an error with the install command', () => {
    initIn(root)
    claudeDir = claudeDirWith(root, [])
    expect(report().findings).toEqual([
      { level: 'error', where: 'Claude Code', text: 'the plugin kit@harness-kit of the pack core is off: its hooks and skills do not run', fix: 'claude plugin install kit@harness-kit' },
    ])
  })

  test('the plugin of each pack on here is checked too', () => {
    initIn(root, ['engineering'])
    claudeDir = claudeDirWith(root, ['kit@harness-kit'])
    expect(texts()).toEqual(['the plugin kit-engineering@harness-kit of the pack engineering is off: its hooks and skills do not run'])
  })

  test('a plugin that the settings of the environment turn on counts', () => {
    initIn(root)
    claudeDir = claudeDirWith(root, [])
    const settings = join(root, '.claude', 'settings.local.json')
    mkdirSync(join(root, '.claude'), { recursive: true })
    writeFileSync(settings, JSON.stringify({ enabledPlugins: { 'kit@harness-kit': true } }))
    expect(texts()).toEqual(['1 environment above, 1 packs on, no gap'])
  })
})

describe('Doctor: the gaps of a pack', () => {
  test('a gap that a pack finds in its home is listed, named by the pack', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: [engineering]\n')
    expect(report([fakePack(true)]).findings).toEqual([
      { level: 'warn', where: root, text: 'engineering: work/ is missing', fix: 'kit init --update' },
    ])
  })

  test('the health line of a pack is not a gap', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: [engineering]\n')
    expect(texts([fakePack(false)])).toEqual(['1 environment above, 2 packs on, no gap'])
  })
})

describe('formatDoctor', () => {
  test('the line of each environment lists core first', () => {
    initIn(root)
    expect(formatDoctor(report(), root).split('\n')[1]).toBe(`  • ${root}  packs: core`)
  })

  test('a gap prints its mark, its text and its fix', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: [ghost]\n')
    expect(formatDoctor(report(), root)).toContain(
      '  ✗ kit.yml names a pack that does not exist: ghost\n      fix: remove it, or install a kit that ships "ghost"',
    )
  })
})
