import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { doctor } from '../../src/doctor/doctor.ts'
import { formatDoctor } from '../../src/doctor/format.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir()
})
afterEach(() => removeDir(root))

const texts = () => doctor(root).findings.map(f => f.text)

describe('Doctor', () => {
  test('outside an environment it reports one error with the fix to init', () => {
    expect(doctor(root).findings).toEqual([
      { level: 'error', where: root, text: 'not inside an environment: no kit.yml here or above', fix: 'run `kit init` in this folder or in one above it' },
    ])
  })

  test('a fresh environment has no gap', () => {
    initIn(root)
    expect(texts()).toEqual(['1 environment above, 1 packs on, no gap'])
  })

  test('a rule of the owner with the name of a base rule is a gap with the fix to turn one off', () => {
    initIn(root)
    writeFileSync(join(root, '.claude', 'rules', 'writing.md'), '# mine\n')
    expect(doctor(root).findings).toEqual([
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

describe('formatDoctor', () => {
  test('the line of each environment lists core first', () => {
    initIn(root)
    expect(formatDoctor(doctor(root), root).split('\n')[1]).toBe(`  • ${root}  packs: core`)
  })

  test('a gap prints its mark, its text and its fix', () => {
    initIn(root)
    writeFileSync(join(root, 'kit.yml'), 'packs: [ghost]\n')
    expect(formatDoctor(doctor(root), root)).toContain(
      '  ✗ kit.yml names a pack that does not exist: ghost\n      fix: remove it, or install a kit that ships "ghost"',
    )
  })
})
