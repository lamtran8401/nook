import { describe, expect, test } from 'bun:test'

import { addSections, nookYaml } from '../../src/init/nook-file.ts'

describe('nookYaml', () => {
  test('writes the comments and an empty section for each feature named', () => {
    const text = nookYaml(['engineering', 'wiki'])
    expect(text.startsWith('# Nook: this folder is a workspace.')).toBe(true)
    expect(text.endsWith('\nengineering: {}\nwiki: {}\n')).toBe(true)
  })

  test('with no feature writes the comments only', () => {
    expect(nookYaml([]).split('\n').filter(line => line && !line.startsWith('#'))).toEqual([])
  })
})

describe('addSections', () => {
  test('adds an empty section at the end and keeps every other byte', () => {
    expect(addSections('# mine\nsecrets: [a.yaml]\n', ['wiki'])).toBe('# mine\nsecrets: [a.yaml]\nwiki: {}\n')
  })

  test('with nothing missing gives the file back as it was', () => {
    expect(addSections('wiki: {}\n', [])).toBe('wiki: {}\n')
  })
})
