import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
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
  test.each(['.env', 'app/.env.local', '.env.bak~', 'prod.env', 'config/app.env', 'process.env', '.npmrc', '~/.ssh/id_rsa', '~/.config/twg/auth.conf', '~/.config/gh/hosts.yml', 'config/infra.local.yaml'])('blocks a read of %s', file => {
    expect(read(file)).toBe('block')
  })

  test('blocks a secret of nook.yml by its full path', () => {
    expect(read(join(root, 'config/infra.local.yaml'))).toBe('block')
  })

  test.each(['.env.example', 'src/app.ts', '~/.config/git/config'])('lets a read of %s pass', file => {
    expect(read(file)).toBe('pass')
  })

  test('does nothing outside a desk', () => {
    const outside = tempDir('nook-outside-')
    expect(read('.env', outside)).toBe('pass')
    removeDir(outside)
  })
})

describe('bashGuard', () => {
  test('reads a # inside quotes as text, so a secret after it still blocks', () => {
    expect(bash('echo " #"; cat .env')).toBe('block')
  })

  test.each(['cat .env', "cat '.env'", 'cat .env.local', 'cat ./app/.env.local', 'cat $HOME/.env', 'cat ${HOME}/.env', 'docker run --env-file=.env app', 'cat prod.env', 'cat config/app.env', 'cat ~/.aws/credentials', 'cat ~/.config/twg/auth.conf', 'cat $HOME/.config/gh/hosts.yml', 'cat config/infra.local.yaml'])(
    'blocks a command that reaches a secret: %s',
    command => expect(bash(command)).toBe('block'),
  )

  test.each(['grep -n process.env src', 'grep -rn Bun.env src', "sed -i '' 's/...env.packs/...desk.packs/' f.ts", 'cat app.env.ts'])(
    'lets a word that only contains .env pass: %s',
    command => expect(bash(command)).toBe('pass'),
  )

  test.each([
    'sqlite3 .nook/engineering.db', 'cat .nook/x.db', 'cd db && sqlite3 a.db', '/usr/bin/sqlite3 a.db', 'X=1 sqlite3 a.db', 'sudo sqlite a.db', 'echo .q | sqlite3 a.db',
    'bash -c "cd .nook && sqlite3 ledger.db"', 'bash -lc "sqlite3 x"', 'find . -name a.db -exec sqlite3 {} .dump \\;', 'X="a b" sqlite3 /tmp/x.db',
    'timeout 5 sqlite3 x', 'nice sqlite3 x', 'sudo -u root sqlite3 x', 'if true; then sqlite3 x; fi', '{ sqlite3 x; }', '! sqlite3 x',
    'echo `sqlite3 x`', 'echo "$(sqlite3 x)"', 'eval "sqlite3 x"',
    "bash --norc -c 'sqlite3 x'", "sh -e -c 'sqlite3 x'", "echo 'sqlite3 x' | sh", "printf 'sqlite3 x\\n' | bash", 'bash <<EOF\nsqlite3 x\nEOF',
    'echo " #"; sqlite3 x', "echo '<<X'\nsqlite3 x",
  ])('blocks a command on a state database: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test.each(['grep -rn "bun:sqlite" src', 'grep -n "sqlite interface\\|command runner" docs/plan.md', "grep -e 'x|sqlite' f", 'echo "\\$(sqlite3 x)"'])('lets a search pattern or escaped text that only contains sqlite pass: %s', command => {
    expect(bash(command)).toBe('pass')
  })

  test.each(['NOOK_ROLE=owner nook eng item approve A-1', 'NOOK_ACTOR=x nook doctor', 'env -u CLAUDECODE nook doctor'])('blocks a command that sets a role: %s', command => {
    expect(bash(command)).toBe('block')
  })

  test.each(['curl http://127.0.0.1:4321/', 'curl -s localhost:4321/works', 'wget 0.0.0.0:4321', 'curl "http://[::1]:4321/?t=x"'])('blocks a call to the port of the running web app: %s', command => {
    mkdirSync(join(root, '.nook'), { recursive: true })
    writeFileSync(join(root, '.nook', 'web.json'), JSON.stringify({ port: 4321, pid: 9, started: 'now' }))
    expect(bash(command)).toBe('block')
  })

  test('lets a call to another port pass, and any call when no web app runs', () => {
    expect(bash('curl http://127.0.0.1:4321/')).toBe('pass')
    mkdirSync(join(root, '.nook'), { recursive: true })
    writeFileSync(join(root, '.nook', 'web.json'), JSON.stringify({ port: 4321, pid: 9, started: 'now' }))
    expect(bash('curl http://127.0.0.1:43210/')).toBe('pass')
  })

  test('reads a comment and a heredoc body as text, not as a command', () => {
    expect(bash("cat > nook.yml <<'EOF'\n# secrets: files such as .env that no agent reads\nsecrets: []\nEOF")).toBe('pass')
    expect(bash('nook doctor # the .env rule is on')).toBe('pass')
  })

  test('still blocks a command that follows a heredoc', () => {
    expect(bash('cat > note.md <<EOF\nnever read .env\nEOF\ncat .env')).toBe('block')
  })

  test.each(['cat .env.example', 'git status', 'nook doctor', 'gh issue view 12', 'cat ~/.config/git/config'])('lets %s pass', command => {
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

  test.each(['.npmrc', 'app/.npmrc', '~/.ssh/config', '~/.aws/credentials', '~/.config/gh/hosts.yml', 'config/infra.local.yaml'])('blocks an edit of the secret file %s', file => {
    expect(edit(file)).toBe('block')
  })

  test('blocks an edit of a secret of nook.yml by its full path', () => {
    expect(edit(join(root, 'config/infra.local.yaml'))).toBe('block')
  })

  test.each(['CLAUDE.md', '.claude/rules/mine.md', '.env.example'])('lets an edit of %s pass', file => {
    expect(edit(file)).toBe('pass')
  })
})
