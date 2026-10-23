import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { FeatureModule } from '@nook/desk/desks.ts'

import { styleCheck } from '../../src/hooks/style.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

const LONG = 'This sentence should really be split because it is very long and it goes on and on with more than twenty five words in it for sure.\n'

let root: string
beforeEach(() => {
  root = tempDir('nook-style-')
  initIn(root)
})
afterEach(() => removeDir(root))

/** Writes the file and runs the check on it, as the PostToolUse hook does. */
const check = (rel: string, text: string, modules: FeatureModule[] = []) => {
  const file = join(root, rel)
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, text)
  return styleCheck({ cwd: root, tool_name: 'Write', tool_input: { file_path: file } }, { modules })
}

/** A pack whose record lives in works/. */
const itemsPack = { name: 'items', setup: () => [], configured: () => true, doctor: () => [], records: () => [join(root, 'works')] } satisfies FeatureModule

describe('styleCheck', () => {
  test('a long document under docs/ comes back with each failing sentence and why', () => {
    const result = check('docs/spec.md', LONG.repeat(3))
    expect(result.kind).toBe('block')
    expect(result.kind === 'block' && result.reason).toContain('27 words (max 25); banned: should, very, really')
  })

  test('a document of short sentences passes', () => {
    expect(check('docs/good.md', 'The check passes.\nEach line is short.\n').kind).toBe('pass')
  })

  test('a long document in a folder that a pack names as its record comes back', () => {
    expect(check('works/SHOP-12/spec.md', LONG.repeat(3), [itemsPack]).kind).toBe('block')
  })

  test('the same document is not checked when no pack names its folder', () => {
    expect(check('works/SHOP-12/spec.md', LONG.repeat(3)).kind).toBe('pass')
  })

  test('a Markdown file outside the folders of the record is not checked', () => {
    expect(check('src/README.md', LONG).kind).toBe('pass')
  })

  test('the archive under docs/ is not checked', () => {
    expect(check('docs/archive/old.md', LONG).kind).toBe('pass')
  })
})

describe('styleCheck of the bench blocks', () => {
  const bench = (json: string) => `The plan of the export.\n\n\`\`\`bench\n${json}\n\`\`\`\n`
  const reason = (result: ReturnType<typeof check>) => (result.kind === 'block' ? result.reason : '')

  test('a block with an edge to a missing node comes back with its line and the node', () => {
    const result = check('docs/plan.md', bench('{"type":"graph","nodes":[{"id":"a"}],"edges":[{"from":"a","to":"vault"}]}'))
    expect(reason(result)).toBe('docs/plan.md: the bench block at line 3 does not draw. Fix it:\n  - edge 1 goes to "vault", a node that the block does not have')
  })

  test('a block that is not valid JSON comes back with its line', () => {
    expect(reason(check('docs/plan.md', bench('{ "type": "graph",')))).toStartWith('docs/plan.md: the bench block at line 3 does not draw. Fix it:\n  - the block is not valid JSON:')
  })

  test('a valid block passes', () => {
    expect(check('docs/plan.md', bench('{"type":"graph","nodes":[{"id":"a"},{"id":"b"}],"edges":[{"from":"a","to":"b"}]}')).kind).toBe('pass')
  })

  test('a weak sentence and a broken block both come back', () => {
    const result = reason(check('docs/plan.md', LONG.repeat(3) + bench('{"type":"pie"}')))
    expect(result).toContain('pass the writing standard')
    expect(result).toContain('the bench block at line 6 does not draw')
  })
})
