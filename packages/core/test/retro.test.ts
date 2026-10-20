import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { RetroFact } from '@nook/desk/desks.ts'

import { blockFacts, errorFacts, eventLines, formatFacts, retroFile, retroSince } from '../src/retro/retro.ts'
import { removeDir, tempDir } from './helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir()
})
afterEach(() => removeDir(root))

const NOW = new Date(2026, 9, 23, 17, 0)

describe('retroSince', () => {
  test('is the time of the newest retro file, so a fact after it on the same day still counts', () => {
    mkdirSync(join(root, 'docs', 'retro'), { recursive: true })
    writeFileSync(join(root, 'docs', 'retro', '2026-10-09.md'), '# old\n')
    writeFileSync(join(root, 'docs', 'retro', '2026-10-16.md'), '# last\n')
    utimesSync(join(root, 'docs', 'retro', '2026-10-09.md'), new Date(2026, 9, 9, 18, 0), new Date(2026, 9, 9, 18, 0))
    utimesSync(join(root, 'docs', 'retro', '2026-10-16.md'), new Date(2026, 9, 16, 18, 0), new Date(2026, 9, 16, 18, 0))
    expect(retroSince(root, NOW)).toEqual(new Date(2026, 9, 16, 18, 0))
  })

  test('with no retro yet, the span is the last 7 days', () => {
    expect(retroSince(root, NOW)).toEqual(new Date(2026, 9, 16, 17, 0))
  })
})

describe('retroFile', () => {
  test('is the file of the day, and says when it exists', () => {
    expect(retroFile(root, NOW)).toEqual({ path: 'docs/retro/2026-10-23.md', exists: false })
    mkdirSync(join(root, 'docs', 'retro'), { recursive: true })
    writeFileSync(join(root, 'docs', 'retro', '2026-10-23.md'), '# today\n')
    expect(retroFile(root, NOW).exists).toBe(true)
  })
})

describe('formatFacts', () => {
  test('groups the facts by kind, each with its item', () => {
    const facts: RetroFact[] = [
      { item: 'IT-7', kind: 'sent back', text: 'AC 4 has no test', at: '2026-10-20T09:00:00.000Z' },
      { item: 'IT-8', kind: 'guess flipped', text: 'G2 flipped; answer: 2 rows', at: '2026-10-21T09:00:00.000Z' },
      { item: 'IT-8', kind: 'sent back', text: 'nits: a name', at: '2026-10-22T09:00:00.000Z' },
    ]
    expect(formatFacts(facts)).toBe(['sent back (2)', '- IT-7: AC 4 has no test', '- IT-8: nits: a name', '', 'guess flipped (1)', '- IT-8: G2 flipped; answer: 2 rows'].join('\n'))
  })

  test('a span with no fact says so', () => {
    expect(formatFacts([])).toBe('Nothing went wrong in the span.')
  })
})

describe('blockFacts', () => {
  test('gives each reason of a block once with its count, the most frequent first', () => {
    const block = (hook: string, reason: string, at: string) => ({ kind: 'block' as const, hook, reason, at })
    expect(blockFacts([block('eng bash', 'may not run `date`.', '2026-10-19T09:00:00Z'), block('core bash', 'a secret', '2026-10-19T09:10:00Z'), block('eng bash', 'may not run `date`.', '2026-10-19T09:20:00Z')])).toEqual([
      { kind: 'guard blocks', item: 'eng bash', text: '2× may not run `date`.', at: '2026-10-19T09:20:00Z' },
      { kind: 'guard blocks', item: 'core bash', text: '1× a secret', at: '2026-10-19T09:10:00Z' },
    ])
  })
})

describe('errorFacts', () => {
  test('gives each hook error once with its count', () => {
    const error = (at: string) => ({ kind: 'error' as const, hook: 'core start', reason: 'cannot read nook.yml', at })
    expect(errorFacts([error('2026-10-19T09:00:00Z'), error('2026-10-19T10:00:00Z')])).toEqual([{ kind: 'hook errors', item: 'core start', text: '2× cannot read nook.yml', at: '2026-10-19T10:00:00Z' }])
  })
})

describe('eventLines', () => {
  test('gives one line for each event: its time, then the prompt or the block with its hook', () => {
    expect(eventLines([{ kind: 'prompt', at: '2026-10-19T09:00:00Z', text: 'merge' }, { kind: 'block', at: '2026-10-19T09:05:00Z', hook: 'eng bash', agent: 'nk-eng:reviewer', reason: 'no', command: 'date' }, { kind: 'error', at: '2026-10-19T09:06:00Z', hook: 'core start', agent: 'lead', reason: 'boom', command: '' }])).toBe(
      '2026-10-19T09:00:00Z  prompt  merge\n2026-10-19T09:05:00Z  block   eng bash (nk-eng:reviewer): no · date\n2026-10-19T09:06:00Z  error   core start (lead): boom · ',
    )
  })
})
