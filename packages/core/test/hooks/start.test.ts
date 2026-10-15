import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { sessionStart } from '../../src/hooks/start.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

describe('sessionStart', () => {
  let root: string
  beforeEach(() => {
    root = tempDir('kit-start-')
    initIn(root)
  })
  afterEach(() => removeDir(root))

  test('adds the environment and its packs as context', () => {
    expect(sessionStart({ cwd: root })).toEqual({
      kind: 'json',
      value: {
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: `Harness Kit environment: ${root}. Packs on: core. The base rules are in .claude/rules/kit/. Run \`kit doctor\` for the environments above and every gap.`,
        },
      },
    })
  })
})
