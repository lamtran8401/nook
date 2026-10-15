import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { bashGuard, editGuard, readGuard } from '../../src/hooks/guards.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir('kit-hooks-')
  initIn(root)
  writeFileSync(join(root, 'kit.yml'), 'packs: []\nsecrets: [config/infra.local.yaml]\n')
})
afterEach(() => removeDir(root))

const read = (file_path: string, cwd = root) => readGuard({ cwd, tool_name: 'Read', tool_input: { file_path } }).kind
const bash = (command: string, cwd = root) => bashGuard({ cwd, tool_name: 'Bash', tool_input: { command } }).kind
const edit = (file_path: string) => editGuard({ cwd: root, tool_name: 'Edit', tool_input: { file_path } }).kind

describe('readGuard', () => {
  test.each(['.env', 'app/.env.local', '.npmrc', '~/.ssh/id_rsa', 'config/infra.local.yaml'])('blocks a read of %s', file => {
    expect(read(file)).toBe('block')
  })

  test('blocks a secret of kit.yml by its full path', () => {
    expect(read(join(root, 'config/infra.local.yaml'))).toBe('block')
  })

  test.each(['.env.example', 'src/app.ts'])('lets a read of %s pass', file => {
    expect(read(file)).toBe('pass')
  })

  test('does nothing outside an environment', () => {
    const outside = tempDir('kit-outside-')
    expect(read('.env', outside)).toBe('pass')
    removeDir(outside)
  })
})

describe('bashGuard', () => {
  test.each(['cat .env', "cat '.env'", 'cat ./app/.env.local', 'cat ~/.aws/credentials', 'cat config/infra.local.yaml'])(
    'blocks a command that reaches a secret: %s',
    command => expect(bash(command)).toBe('block'),
  )

  test.each(['sqlite3 .kit/engineering.db', 'cat .kit/x.db'])('blocks a command on a state database: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test.each(['KIT_ROLE=owner kit eng item approve A-1', 'env -u CLAUDECODE kit doctor'])('blocks a command that sets a role: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test('reads a comment and a heredoc body as text, not as a command', () => {
    expect(bash("cat > kit.yml <<'EOF'\n# secrets: files such as .env that no agent reads\nsecrets: []\nEOF")).toBe('pass')
    expect(bash('kit doctor # the .env rule is on')).toBe('pass')
  })

  test('still blocks a command that follows a heredoc', () => {
    expect(bash('cat > note.md <<EOF\nnever read .env\nEOF\ncat .env')).toBe('block')
  })

  test.each(['cat .env.example', 'git status', 'kit doctor'])('lets %s pass', command => {
    expect(bash(command)).toBe('pass')
  })

  test('does nothing outside an environment', () => {
    const outside = tempDir('kit-outside-')
    expect(bash('cat .env', outside)).toBe('pass')
    removeDir(outside)
  })
})

describe('editGuard', () => {
  test.each(['.env', '.kit/state.json', '.claude/settings.json', '.claude/settings.local.json'])('blocks an edit of %s', file => {
    expect(edit(file)).toBe('block')
  })

  test.each(['CLAUDE.md', '.claude/rules/mine.md'])('lets an edit of %s pass', file => {
    expect(edit(file)).toBe('pass')
  })
})
