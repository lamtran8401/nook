import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { FeatureModule } from '@nook/desk/desks.ts'

import { doctor } from '../../src/doctor/doctor.ts'
import { formatDoctor } from '../../src/doctor/format.ts'
import { claudeDirWith, initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
let claudeDir: string
beforeEach(() => {
  root = tempDir()
  claudeDir = claudeDirWith(root, ['nook@nook'])
})
afterEach(() => removeDir(root))

const report = (modules: FeatureModule[] = []) => doctor(root, { claudeDir, modules })
const texts = (modules: FeatureModule[] = []) => report(modules).findings.map(f => f.text)

/** A feature module that reports one gap, or none, and whose section is filled in, or not. */
const fakeFeature = (gap: boolean, configured = true): FeatureModule => ({
  name: 'engineering',
  setup: () => [],
  configured: () => configured,
  doctor: dir => [gap ? { level: 'warn', where: dir, text: 'works/ is missing', fix: 'nook init --update' } : { level: 'ok', where: dir, text: 'no gap' }],
})

describe('Doctor', () => {
  test('outside a desk it reports one error with the fix to init', () => {
    expect(report().findings).toEqual([
      { level: 'error', where: root, text: 'not inside a desk: no nook.yml here or above', fix: 'run `nook init` in this folder or in one above it' },
    ])
  })

  test('a fresh desk with its plugin on has no gap', () => {
    initIn(root)
    expect(texts()).toEqual(['1 desk above, 1 feature on, no gap'])
  })

  test('a rule of the owner with the name of a base rule is a gap with the fix to turn one off', () => {
    initIn(root)
    writeFileSync(join(root, '.claude', 'rules', 'writing.md'), '# mine\n')
    expect(report().findings).toEqual([
      { level: 'warn', where: root, text: 'two rules named "writing": yours and Nook\'s; Claude can follow either', fix: 'turn the nook rule off (rules: { off: [writing] }) or rename yours' },
    ])
  })

  test('a retired key of an older Nook is a gap with the fix to delete it', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'packs: [engineering]\nlearn:\n  dir: learn\n')
    expect(report().findings).toEqual([
      { level: 'warn', where: root, text: 'nook.yml still has `packs:`; a feature is on where nook.yml has its section', fix: `delete \`packs:\` from ${root}/nook.yml` },
      { level: 'warn', where: root, text: 'nook.yml still has a `learn:` section; Nook has no learn feature now', fix: `delete \`learn:\` from ${root}/nook.yml` },
    ])
  })

  test('a secret of nook.yml that is not on disk is a gap', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'secrets: [config/gone.yaml]\n')
    expect(texts()).toEqual(['a secret of nook.yml does not exist: config/gone.yaml'])
  })

})

describe('Doctor: the plugins of Claude Code', () => {
  test('a plugin that the user settings do not turn on is an error with the install command', () => {
    initIn(root)
    claudeDir = claudeDirWith(root, [])
    expect(report().findings).toEqual([
      { level: 'error', where: 'Claude Code', text: 'the plugin nook@nook is off: its hooks and skills do not run', fix: 'claude plugin install nook@nook' },
    ])
  })

  test('a plugin of an older Nook that is still on is a gap with the fix to uninstall it', () => {
    initIn(root)
    claudeDir = claudeDirWith(root, ['nook@nook', 'nk-eng@nook'])
    expect(report().findings).toEqual([
      { level: 'warn', where: 'Claude Code', text: 'the plugin nk-eng@nook of an older Nook is still on; the plugin nook@nook holds its parts now', fix: 'claude plugin uninstall nk-eng@nook' },
    ])
  })

  test('a plugin that the settings of the desk turn on counts', () => {
    initIn(root)
    claudeDir = claudeDirWith(root, [])
    const settings = join(root, '.claude', 'settings.local.json')
    mkdirSync(join(root, '.claude'), { recursive: true })
    writeFileSync(settings, JSON.stringify({ enabledPlugins: { 'nook@nook': true } }))
    expect(texts()).toEqual(['1 desk above, 1 feature on, no gap'])
  })
})

describe('Doctor: the gaps of a feature', () => {
  test('a gap that a feature finds in its home is listed, named by the feature', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'engineering: {}\n')
    expect(report([fakeFeature(true)]).findings).toEqual([
      { level: 'warn', where: root, text: 'engineering: works/ is missing', fix: 'nook init --update' },
    ])
  })

  test('the health line of a feature is not a gap', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'engineering: {}\n')
    expect(texts([fakeFeature(false)])).toEqual(['1 desk above, 2 features on, no gap'])
  })

  test('a feature whose section is not filled in is a gap with the fix to run /setup', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'engineering: {}\n')
    expect(report([fakeFeature(false, false)]).findings).toEqual([
      { level: 'warn', where: root, text: 'engineering: the `engineering:` section of nook.yml is not filled in', fix: 'in Claude Code, run /setup' },
    ])
  })
})

describe('formatDoctor', () => {
  test('the line of each desk lists the sections of its nook.yml', () => {
    initIn(root, ['engineering'])
    expect(formatDoctor(report(), root).split('\n')[1]).toBe(`  • ${root}  sections: engineering`)
  })

  test('a gap prints its mark, its text and its fix', () => {
    initIn(root)
    writeFileSync(join(root, 'nook.yml'), 'secrets: [gone.yaml]\n')
    expect(formatDoctor(report(), root)).toContain('  ! a secret of nook.yml does not exist: gone.yaml\n      fix: remove it from `secrets`, or check the path')
  })
})
