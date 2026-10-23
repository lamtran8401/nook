import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { promptHook } from '../../src/hooks/prompt.ts'
import { removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir()
  writeFileSync(join(root, 'nook.yml'), 'secrets: []\n')
})
afterEach(() => removeDir(root))

describe('promptHook', () => {
  test('keeps the prompt of the owner in the log of the workspace, a token masked, and lets it pass', () => {
    const result = promptHook({ cwd: root, session_id: 's1', hook_event_name: 'UserPromptSubmit', prompt: 'look good, the key is sk-ant-api03-abcdefghijklmnopqrstuv' })
    expect(result).toEqual({ kind: 'pass' })
    const [day] = readdirSync(join(root, '.nook', 'events'))
    const line = JSON.parse(readFileSync(join(root, '.nook', 'events', day!), 'utf8'))
    expect([line.kind, line.session, line.text]).toEqual(['prompt', 's1', 'look good, the key is [secret]'])
  })
})
