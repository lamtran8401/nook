import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { bashGuard, commandOnly, editGuard, readGuard, sessionStart, styleCheck } from '../src/hooks.ts'
import { init } from '../src/init.ts'

const coreDir = join(import.meta.dir, '..', '..', '..', 'plugins', 'core')
let root: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'kit-hooks-'))
  init({ dir: root, packs: [], update: false, coreDir })
  writeFileSync(join(root, 'kit.yml'), 'packs: []\nsecrets: [config/infra.local.yaml]\n')
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const read = (file_path: string, cwd = root) => readGuard({ cwd, tool_name: 'Read', tool_input: { file_path } })
const bash = (command: string, cwd = root) => bashGuard({ cwd, tool_name: 'Bash', tool_input: { command } })
const edit = (file_path: string, cwd = root) => editGuard({ cwd, tool_name: 'Edit', tool_input: { file_path } })

describe('E-06 secrets stay closed', () => {
  test('reads of .env, .env.local, .npmrc, ~/.ssh and the secrets of kit.yml are blocked; .env.example passes', () => {
    for (const f of ['.env', 'app/.env.local', '.npmrc', '~/.ssh/id_rsa', 'config/infra.local.yaml', join(root, 'config/infra.local.yaml')]) expect(read(f).kind).toBe('block')
    expect(read('.env.example').kind).toBe('pass')
    expect(read('src/app.ts').kind).toBe('pass')
  })

  test('the shell cannot reach them either, in any spelling', () => {
    for (const c of ['cat .env', "cat '.env'", 'cat ./app/.env.local', 'cat ~/.aws/credentials', 'cat config/infra.local.yaml', 'sqlite3 .kit/engineering.db', 'cat .kit/x.db', 'KIT_ROLE=owner kit eng item approve A-1', 'env -u CLAUDECODE kit doctor']) {
      expect(bash(c).kind).toBe('block')
    }
    expect(bash('cat .env.example').kind).toBe('pass')
    // text is not a command: a comment, a heredoc body, an echo of prose
    expect(bash("cat > kit.yml <<'EOF'\n# secrets: the paths of files such as .env that no agent reads\nsecrets: []\nEOF").kind).toBe('pass')
    expect(bash('kit doctor # the .env rule is on').kind).toBe('pass')
    expect(bash("cat > note.md <<EOF\nnever read .env\nEOF\ncat .env").kind).toBe('block')
    expect(bash('git status').kind).toBe('pass')
    expect(bash('kit doctor').kind).toBe('pass')
  })

  test('edits of .env, .kit and the settings are blocked', () => {
    for (const f of ['.env', '.kit/state.json', '.claude/settings.json', '.claude/settings.local.json']) expect(edit(f).kind).toBe('block')
    expect(edit('CLAUDE.md').kind).toBe('pass')
    expect(edit('.claude/rules/mine.md').kind).toBe('pass')
  })

  test('outside an environment the guards do nothing', () => {
    const outside = mkdtempSync(join(tmpdir(), 'kit-outside-'))
    expect(read('.env', outside).kind).toBe('pass')
    expect(bash('cat .env', outside).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})

describe('E-07 writing check', () => {
  test('a long document under docs/ comes back with its sentences; code and other folders pass', () => {
    mkdirSync(join(root, 'docs'), { recursive: true })
    const bad = join(root, 'docs', 'spec.md')
    writeFileSync(bad, 'This sentence should really be split because it is very long and it goes on and on with more than twenty five words in it for sure.\n'.repeat(3))
    const result = styleCheck({ cwd: root, tool_name: 'Write', tool_input: { file_path: bad } })
    expect(result.kind).toBe('block')
    if (result.kind === 'block') expect(result.reason).toContain('banned: should')
    const good = join(root, 'docs', 'good.md')
    writeFileSync(good, 'The check passes.\nEach line is short.\n')
    expect(styleCheck({ cwd: root, tool_name: 'Write', tool_input: { file_path: good } }).kind).toBe('pass')
    mkdirSync(join(root, 'src'), { recursive: true })
    const code = join(root, 'src', 'README.md')
    writeFileSync(code, 'This sentence should really be split because it is very long and it goes on and on with more than twenty five words in it for sure.\n')
    expect(styleCheck({ cwd: root, tool_name: 'Write', tool_input: { file_path: code } }).kind).toBe('pass')
  })
})

describe('session start', () => {
  test('adds the environment and its packs as context', () => {
    const result = sessionStart({ cwd: root })
    expect(result.kind).toBe('json')
    if (result.kind === 'json') expect(JSON.stringify(result.value)).toContain('Packs on: core')
  })
})

describe('commandOnly', () => {
  test('drops heredoc bodies and comments, keeps the commands', () => {
    expect(commandOnly("cat > a <<'EOF'\nbody .env\nEOF\nls # note .env\ncat .env")).toBe("cat > a <<'EOF'\nls\ncat .env")
  })
})
