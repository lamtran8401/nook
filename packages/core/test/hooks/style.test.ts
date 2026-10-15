import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { styleCheck } from '../../src/hooks/style.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

const LONG = 'This sentence should really be split because it is very long and it goes on and on with more than twenty five words in it for sure.\n'

let root: string
beforeEach(() => {
  root = tempDir('kit-style-')
  initIn(root)
})
afterEach(() => removeDir(root))

/** Writes the file and runs the check on it, as the PostToolUse hook does. */
const check = (rel: string, text: string) => {
  const file = join(root, rel)
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, text)
  return styleCheck({ cwd: root, tool_name: 'Write', tool_input: { file_path: file } })
}

describe('styleCheck', () => {
  test('a long document under docs/ comes back with each failing sentence and why', () => {
    const result = check('docs/spec.md', LONG.repeat(3))
    expect(result.kind).toBe('block')
    expect(result.kind === 'block' && result.reason).toContain('27 words (max 25); banned: should, very, really')
  })

  test('a document of short sentences passes', () => {
    expect(check('docs/good.md', 'The check passes.\nEach line is short.\n').kind).toBe('pass')
  })

  test('a Markdown file outside the folders of the record is not checked', () => {
    expect(check('src/README.md', LONG).kind).toBe('pass')
  })

  test('the archive under docs/ is not checked', () => {
    expect(check('docs/archive/old.md', LONG).kind).toBe('pass')
  })
})
