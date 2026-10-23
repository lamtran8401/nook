import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { packParts } from '../src/pack-parts.ts'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-parts-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('packParts', () => {
  test('gives each agent and skill of core and of the packs on in the desk, with its pack and the first sentence of its job', () => {
    writeFileSync(join(dir, 'nook.yml'), 'packs: [engineering]\n')
    const parts = packParts(dir)
    expect(parts).toContainEqual({ kind: 'agent', pack: 'engineering', name: 'scout', job: 'Reads code and tickets and reports facts with path and line, guesses marked, in 40 lines or fewer.' })
    expect(parts).toContainEqual(expect.objectContaining({ kind: 'skill', pack: 'core', name: 'setup' }))
  })
})
