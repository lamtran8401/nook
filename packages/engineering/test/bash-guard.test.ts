import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookInput } from '@kit/shared/hook.ts'

import { bashGuard, inject } from '../src/hooks/bash-guard.ts'
import { normalize } from '../src/hooks/shell.ts'
import { makeHome, type TestHome } from './helpers.ts'
import { BUILDER_AGENT, reason, REVIEWER, rewritten, SCOUT, VERIFIER } from './hook-inputs.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const bash = (command: string, extra: Partial<HookInput> = {}) => bashGuard({ cwd: t.root, session_id: 'sess-1', tool_name: 'Bash', tool_input: { command }, ...extra })

describe('bashGuard: the owner moves and the plain name of the tool', () => {
  test('approve, accept and mode through kit eng, kit-eng, kit engineering, with quotes and backslashes', () => {
    for (const c of [
      'kit eng item approve SHOP-1', 'kit-eng item accept SHOP-1', 'kit engineering item approve SHOP-1', 'kit eng item mode SHOP-1 auto',
      'kit eng "item" appr\\ove SHOP-1', "kit   eng item 'approve' SHOP-1", 'cd work && kit eng item approve SHOP-1', 'kit eng item accept SHOP-1 --json',
    ]) {
      const result = bash(c)
      expect(result.kind).toBe('block')
      expect(reason(result)).toMatch(/owner's move/)
    }
    expect(bash('kit eng item approve SHOP-1', BUILDER_AGENT).kind).toBe('block')
    expect(bash('kit eng item show SHOP-1').kind).not.toBe('block')
    expect(bash('kit eng item check SHOP-1').kind).not.toBe('block')
  })

  test('wrappers, paths to the code and the role variables are blocked', () => {
    for (const c of [
      'env KIT_X=1 kit eng item show A', 'exec kit-eng item show A', 'echo x | xargs kit eng item show', 'eval kit eng item show A', 'sh -c "kit eng item show A"',
      'bash -lc kit-eng next', 'bun packages/engineering/src/commands.ts item show A', '/x/apps/kit/bin/kit eng item show A', 'KIT_ROLE=owner kit eng item approve A', 'env -u CLAUDECODE kit eng next',
    ]) {
      expect(bash(c).kind).toBe('block')
    }
    expect(bash('kit eng next # env is fine in a comment').kind).not.toBe('block')
    expect(bash("cat > note.md <<'EOF'\nexec kit eng item approve A\nEOF").kind).toBe('pass')
  })

  test('outside a home the Bash guard passes', () => {
    const outside = mkdtempSync(join(tmpdir(), 'kit-eng-out-'))
    expect(bashGuard({ cwd: outside, tool_input: { command: 'kit eng item approve A' } }).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})

describe('bashGuard: only command words count', () => {
  test('a quoted word that names a wrapper does not block a later call of the tool', () => {
    expect(bash('kit eng ask IT-1 "One status at a time, or several?" --blocking && kit eng questions IT-1').kind).not.toBe('block')
  })

  test('a path to the source of the kit as an argument does not block', () => {
    expect(bash('wc -l packages/engineering/src/guards/plan.ts').kind).toBe('pass')
    expect(bash('cd packages/engineering && grep -rn Caller src/hooks && bun test packages/engineering').kind).toBe('pass')
  })

  test('an owner move named inside a quoted string is text, not a call', () => {
    expect(bash('kit eng note add IT-1 "the owner runs kit eng item approve IT-1 next"').kind).not.toBe('block')
  })

  test.each(['time kit eng next', 'sh -c "kit eng item approve A"', 'sudo kit eng item show A'])('a wrapper around the tool still blocks: %s', command => {
    expect(reason(bash(command))).toBe('run `kit eng` by its plain name: no env, exec, xargs, eval or sh -c around the tool.')
  })

  test.each(['bun packages/engineering/src/commands.ts item show A', 'bun run apps/kit/src/main.ts eng next', './plugins/engineering/bin/kit eng next'])(
    'a run of the code of the kit by its path still blocks: %s',
    command => expect(reason(bash(command))).toBe('run `kit eng` by its plain name, not by a path to its code.'),
  )

  test.each(['echo $(kit eng item approve A)', 'echo `kit eng item accept A`', "bash <<'EOF'\nkit eng item approve A\nEOF"])('an owner move inside code that runs still blocks: %s', command => {
    expect(reason(bash(command))).toMatch(/owner's move/)
  })

  test.each(['export KIT_ROLE=owner', 'unset CLAUDECODE', 'KIT_ACTOR=x kit eng next'])('a command that sets a role still blocks: %s', command => {
    expect(reason(bash(command))).toBe('the role of an agent is set by the kit, not by a command.')
  })
})

describe('inject: only calls that run get the flags', () => {
  test('a heredoc body that mentions the tool is written as it is', () => {
    const command = "cat > note.md <<'EOF'\nRun $(kit eng next) or (kit eng item show A).\nEOF\nkit eng next"
    expect(rewritten(bash(command))).toBe("cat > note.md <<'EOF'\nRun $(kit eng next) or (kit eng item show A).\nEOF\nkit eng --session sess-1 next")
  })

  test('a quoted string that mentions the tool keeps its text', () => {
    expect(rewritten(bash('echo "then kit eng next" && kit eng next'))).toBe('echo "then kit eng next" && kit eng --session sess-1 next')
  })

  test('a call inside a substitution or after then gets the flags', () => {
    expect(rewritten(bash('if true; then kit eng next; fi'))).toBe('if true; then kit eng --session sess-1 next; fi')
    expect(rewritten(bash('echo $(kit eng next)'))).toBe('echo $(kit eng --session sess-1 next)')
  })

  test('a flag that the model wrote is dropped only from the call', () => {
    expect(rewritten(bash('kit eng item show A --as owner && echo "--as owner"', SCOUT))).toBe(
      'kit eng --as reader --actor scout-0001 --session sess-1 item show A && echo "--as owner"',
    )
  })
})

describe('bashGuard: the role goes in front of each call of an agent', () => {
  test('a builder gets --as, --actor and --session on every segment that starts with the tool', () => {
    const result = bash('cd projects/bff && kit eng task start SHOP-1 T1; kit engineering task brief SHOP-1 T1 | head -3\nkit eng note add SHOP-1 "kit eng is fine in text"', BUILDER_AGENT)
    expect(result.kind).toBe('json')
    expect(rewritten(result)).toBe(
      'cd projects/bff && kit eng --as builder --actor backend-builder-ab12 --session sess-1 task start SHOP-1 T1; kit engineering --as builder --actor backend-builder-ab12 --session sess-1 task brief SHOP-1 T1 | head -3\nkit eng --as builder --actor backend-builder-ab12 --session sess-1 note add SHOP-1 "kit eng is fine in text"',
    )
    expect(bash('ls projects/bff', BUILDER_AGENT).kind).toBe('pass')
    expect(bash('yarn test', BUILDER_AGENT).kind).toBe('pass')
  })

  test('the lead gets only the session; without a session id nothing changes', () => {
    expect(rewritten(bash('kit eng pickup SHOP-1'))).toBe('kit eng --session sess-1 pickup SHOP-1')
    // a flag that the model wrote is dropped
    expect(rewritten(bash('kit eng item show SHOP-1 --as owner --session x', SCOUT))).toBe('kit eng --as reader --actor scout-0001 --session sess-1 item show SHOP-1')
    expect(bashGuard({ cwd: t.root, tool_input: { command: 'kit eng next' } }).kind).toBe('pass')
    expect(inject('kit eng next', { role: 'reader', actor: 'scout-0001', kind: 'reader' })).toBe('kit eng --as reader --actor scout-0001 --session - next')
    expect(normalize('kit "eng" appr\\ove')).toBe('kit eng approve')
  })
})

describe('bashGuard: a reader runs read commands only', () => {
  test('the allowlist: shell reads, git reads, the read commands of the tool; the verifier and the reviewer get theirs', () => {
    for (const c of ['ls -la', 'cat README.md | head', 'rg TODO projects/bff', 'git -C projects/bff status', 'git log --oneline', 'kit eng item show SHOP-1 --json', 'kit eng task list SHOP-1', 'kit eng next', 'kit doctor', 'kit eng item ac list SHOP-1 && kit eng questions SHOP-1']) {
      expect(bash(c, SCOUT).kind).not.toBe('block')
    }
    expect(rewritten(bash('kit eng item brief SHOP-1', SCOUT))).toBe('kit eng --as reader --actor scout-0001 --session sess-1 item brief SHOP-1')
    for (const c of ['rm -rf projects', 'kit eng task start SHOP-1 T1', 'kit eng item verify SHOP-1', 'kit eng item ac done SHOP-1 1 --evidence x --grade run', 'git checkout main', 'git -C projects/bff commit -m x', 'echo $(kit eng next)', 'cat a > b', 'find . -name x -delete', 'kit eng pickup SHOP-1', 'kit eng note add SHOP-1 x', 'yarn test', 'ls; touch x']) {
      const result = bash(c, SCOUT)
      expect(result.kind).toBe('block')
      expect(reason(result)).toMatch(/read|reader|only/)
    }
    expect(bash('kit eng item verify SHOP-1', VERIFIER).kind).toBe('json')
    expect(bash('kit eng task prove SHOP-1 T1 --files tests/a.test.sh', VERIFIER).kind).toBe('json')
    expect(bash('kit eng item ac done SHOP-1 1 --evidence x --grade run', VERIFIER).kind).toBe('block')
    expect(bash('kit eng item ac done SHOP-1 1 --evidence "the test" --grade run', REVIEWER).kind).toBe('json')
    expect(bash('kit eng item verify SHOP-1', REVIEWER).kind).toBe('block')
    expect(bash('cat x 2>/dev/null', SCOUT).kind).toBe('pass')
  })
})
