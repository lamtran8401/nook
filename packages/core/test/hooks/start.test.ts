import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { sessionStart } from '../../src/hooks/start.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

describe('sessionStart', () => {
  let root: string
  beforeEach(() => {
    root = tempDir('nook-start-')
    initIn(root)
  })
  afterEach(() => removeDir(root))

  test('adds the desk and its packs as context', () => {
    expect(sessionStart({ cwd: root })).toEqual({
      kind: 'json',
      value: {
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: `Nook desk: ${root}. Packs on: core. The base rules are in .claude/rules/nook/. Run \`nook doctor\` for the desks above and every gap.`,
        },
      },
    })
  })
})
