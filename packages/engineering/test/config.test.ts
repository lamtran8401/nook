import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@nook/shared/errors.ts'

import { EngineeringConfig } from '../src/config.ts'
import { makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const caught = (work: () => unknown): EvError => {
  try {
    work()
  } catch (error) {
    return error as EvError
  }
  throw new Error('expected a failure')
}

describe('EngineeringConfig', () => {
  test('reads the section with defaults and names each fault with its fix', () => {
    const config = EngineeringConfig.read(t.root)
    expect(config.protected).toEqual(['main', 'master'])
    expect(config.areas.map(a => [a.name, a.kind, a.git, a.checks])).toEqual([['bff', 'backend', true, ['sh test.sh']], ['web', 'frontend', true, ['sh test.sh']]])
    expect(config.tracker).toEqual({ type: 'none' })
    const file = join(t.root, 'nook.yml')
    const faults: [string, RegExp][] = [
      ['engineering:\n  areas:\n    - { name: bff, path: p }\n', /kind must be one of frontend, backend, docs, data, tool/],
      ['engineering:\n  areas:\n    - { path: p, kind: docs }\n', /has no name/],
      ['engineering:\n  areas:\n    - { name: a, kind: docs }\n', /area a has no path/],
      ['engineering:\n  areas:\n    - { name: a, path: p, kind: docs }\n    - { name: a, path: q, kind: docs }\n', /two areas are named a/],
      ['engineering:\n  protected: main\n', /protected must be a list/],
      ['engineering:\n  tracker: { type: trello }\n', /none, jira or github/],
      ['engineering: [a]\n', /engineering must be a map/],
    ]
    for (const [section, pattern] of faults) {
      writeFileSync(file, `packs: [engineering]\n${section}`)
      let error: EvError | undefined
      try {
        EngineeringConfig.read(t.root)
      } catch (e) {
        error = e as EvError
      }
      expect(error?.message).toMatch(pattern)
      expect(error?.code).toBe(Exit.usage)
      expect(error?.fix).toBeTruthy()
    }
    writeFileSync(file, 'packs: [engineering]\n')
    expect(EngineeringConfig.read(t.root)).toMatchObject({ missing: true, areas: [], dir: 'work' })
  })

  test('an area with no git key is a git area, and checks stay missing when the key is missing', () => {
    const config = EngineeringConfig.parse('engineering:\n  areas:\n    - { name: a, path: p, kind: docs }\n', 'nook.yml')
    expect(config.areas).toEqual([{ name: 'a', path: 'p', kind: 'docs', git: true }])
  })

  test('git must be true or false', () => {
    const error = caught(() => EngineeringConfig.parse('engineering:\n  areas:\n    - { name: a, path: p, kind: docs, git: maybe }\n', 'nook.yml'))
    expect(error.code).toBe(Exit.usage)
    expect(error.message).toBe('area a: git must be true or false')
  })
})
