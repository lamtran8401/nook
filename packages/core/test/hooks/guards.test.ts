import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { bashGuard, editGuard, readGuard } from '../../src/hooks/guards.ts'
import { initIn, removeDir, tempDir } from '../helpers.ts'

let root: string
beforeEach(() => {
  root = tempDir('nook-hooks-')
  initIn(root)
  writeFileSync(join(root, 'nook.yml'), 'packs: []\nsecrets: [config/infra.local.yaml]\n')
})
afterEach(() => removeDir(root))

const read = (file_path: string, cwd = root) => readGuard({ cwd, tool_name: 'Read', tool_input: { file_path } }).kind
const bash = (command: string, cwd = root) => bashGuard({ cwd, tool_name: 'Bash', tool_input: { command } }).kind
const edit = (file_path: string) => editGuard({ cwd: root, tool_name: 'Edit', tool_input: { file_path } }).kind

describe('readGuard', () => {
  test.each(['.env', 'app/.env.local', '.env.bak~', 'prod.env', 'config/app.env', 'process.env', '.npmrc', '~/.ssh/id_rsa', 'config/infra.local.yaml'])('blocks a read of %s', file => {
    expect(read(file)).toBe('block')
  })

  test('blocks a secret of nook.yml by its full path', () => {
    expect(read(join(root, 'config/infra.local.yaml'))).toBe('block')
  })

  test.each(['.env.example', 'src/app.ts'])('lets a read of %s pass', file => {
    expect(read(file)).toBe('pass')
  })

  test('does nothing outside a desk', () => {
    const outside = tempDir('nook-outside-')
    expect(read('.env', outside)).toBe('pass')
    removeDir(outside)
  })
})

describe('bashGuard', () => {
  test.each(['cat .env', "cat '.env'", 'cat .env.local', 'cat ./app/.env.local', 'cat $HOME/.env', 'cat ${HOME}/.env', 'docker run --env-file=.env app', 'cat prod.env', 'cat config/app.env', 'cat ~/.aws/credentials', 'cat config/infra.local.yaml'])(
    'blocks a command that reaches a secret: %s',
    command => expect(bash(command)).toBe('block'),
  )

  test.each(['grep -n process.env src', 'grep -rn Bun.env src', "sed -i '' 's/...env.packs/...desk.packs/' f.ts", 'cat app.env.ts'])(
    'lets a word that only contains .env pass: %s',
    command => expect(bash(command)).toBe('pass'),
  )

  test.each(['sqlite3 .nook/engineering.db', 'cat .nook/x.db'])('blocks a command on a state database: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test.each(['NOOK_ROLE=owner nook eng item approve A-1', 'NOOK_ACTOR=x nook doctor', 'env -u CLAUDECODE nook doctor'])('blocks a command that sets a role: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test('reads a comment and a heredoc body as text, not as a command', () => {
    expect(bash("cat > nook.yml <<'EOF'\n# secrets: files such as .env that no agent reads\nsecrets: []\nEOF")).toBe('pass')
    expect(bash('nook doctor # the .env rule is on')).toBe('pass')
  })

  test('still blocks a command that follows a heredoc', () => {
    expect(bash('cat > note.md <<EOF\nnever read .env\nEOF\ncat .env')).toBe('block')
  })

  test.each(['cat .env.example', 'git status', 'nook doctor'])('lets %s pass', command => {
    expect(bash(command)).toBe('pass')
  })

  test.each(['claude -p "/nook:gate approve IT-1"', 'claude --bg "/gate accept IT-1"'])('blocks a session started by a tool that types /gate: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test('lets a session started by a tool pass when it does not name /gate', () => {
    expect(bash('claude -p "summarize the plan"')).toBe('pass')
  })

  test('a path that holds a folder named gate is not the command /gate', () => {
    expect(bash('claude plugin validate . && cat plugins/core/skills/gate/SKILL.md')).toBe('pass')
  })

  test('does nothing outside a desk', () => {
    const outside = tempDir('nook-outside-')
    expect(bash('cat .env', outside)).toBe('pass')
    removeDir(outside)
  })
})

describe('editGuard', () => {
  test.each(['.env', '.env.local', 'app/.env.production', 'prod.env', '.nook/state.json', '.claude/settings.json', '.claude/settings.local.json'])('blocks an edit of %s', file => {
    expect(edit(file)).toBe('block')
  })

  test.each(['.npmrc', 'app/.npmrc', '~/.ssh/config', '~/.aws/credentials', 'config/infra.local.yaml'])('blocks an edit of the secret file %s', file => {
    expect(edit(file)).toBe('block')
  })

  test('blocks an edit of a secret of nook.yml by its full path', () => {
    expect(edit(join(root, 'config/infra.local.yaml'))).toBe('block')
  })

  test.each(['CLAUDE.md', '.claude/rules/mine.md', '.env.example'])('lets an edit of %s pass', file => {
    expect(edit(file)).toBe('pass')
  })
})
