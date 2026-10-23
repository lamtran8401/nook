import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { sessionStart } from '../../src/hooks/start.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

describe('sessionStart', () => {
  let root: string
  beforeEach(() => {
    root = tempDir('nook-start-')
    initIn(root)
  })
  afterEach(() => removeDir(root))

  test('adds the workspace, its features and the agent budget as context', () => {
    expect(sessionStart({ cwd: root })).toEqual({
      kind: 'json',
      value: {
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: `Nook workspace: ${root}. Features on: core. Agent budget: lean. The base rules are in .claude/rules/nook/. Run \`nook doctor\` for the workspaces above and every gap.`,
        },
      },
    })
  })

  test('names a deep budget when nook.yml asks for one', () => {
    writeFileSync(join(root, 'nook.yml'), 'budget: deep\n')
    const result = sessionStart({ cwd: root }) as unknown as { value: { hookSpecificOutput: { additionalContext: string } } }
    expect(result.value.hookSpecificOutput.additionalContext).toContain('Agent budget: deep.')
  })
})
