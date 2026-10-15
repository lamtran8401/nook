import { describe, expect, test } from 'bun:test'

import { addPacks, kitYaml } from '../../src/init/kit-file.ts'

describe('addPacks', () => {
  test('adds to a flow list and changes no other line', () => {
    expect(addPacks('# note\npacks: [a]\nrules: { off: [] }\n', ['b'])).toBe('# note\npacks: [a, b]\nrules: { off: [] }\n')
  })

  test('fills an empty flow list', () => {
    expect(addPacks('packs: []\n', ['b'])).toBe('packs: [b]\n')
  })

  test('adds a line to a block list with the indent of its items, and a comment stays on its line', () => {
    expect(addPacks('# mine\npacks:\n  - a   # first\nrules: {}\n', ['b'])).toBe('# mine\npacks:\n  - a   # first\n  - b\nrules: {}\n')
  })

  test('adds to the on list of a packs map', () => {
    expect(addPacks('packs: { on: [a], off: [x] }\n', ['b'])).toBe('packs: { on: [a, b], off: [x] }\n')
  })

  test('adds a packs line when kit.yml has none', () => {
    expect(addPacks('secrets: []\n', ['b'])).toBe('secrets: []\npacks: [b]\n')
  })

  test('a pack that is there already is not added twice', () => {
    expect(addPacks('packs: [a]\n', ['a'])).toBe('packs: [a]\n')
  })

  test('a packs value that is not a list is refused', () => {
    expect(() => addPacks('packs: everything\n', ['b'])).toThrow('kit.yml has no list of packs that the kit can add to')
  })
})

describe('kitYaml', () => {
  test('ends with the pack list in flow form', () => {
    expect(kitYaml(['a', 'b']).endsWith('\npacks: [a, b]\n')).toBe(true)
  })

  test('an environment with no pack gets an empty list, not an empty key', () => {
    expect(kitYaml([]).endsWith('\npacks: []\n')).toBe(true)
  })
})
