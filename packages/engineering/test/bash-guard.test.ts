import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookInput } from '@nook/shared/hook.ts'

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
  test('approve, accept and mode through nook eng and nook engineering, with quotes and backslashes', () => {
    for (const c of [
      'nook eng item approve SHOP-1', 'nook eng item accept SHOP-1', 'nook engineering item approve SHOP-1', 'nook eng item mode SHOP-1 auto',
      'nook eng "item" appr\\ove SHOP-1', "nook   eng item 'approve' SHOP-1", 'cd work && nook eng item approve SHOP-1', 'nook eng item accept SHOP-1 --json',
    ]) {
      const result = bash(c)
      expect(result.kind).toBe('block')
      expect(reason(result)).toMatch(/owner's move/)
    }
    expect(bash('nook eng item approve SHOP-1', BUILDER_AGENT).kind).toBe('block')
    expect(reason(bash('nook eng item accept SHOP-1'))).toBe("accept is the owner's move: tell the owner to type `/gate accept <id>` in the prompt.")
    expect(bash('nook eng item show SHOP-1').kind).not.toBe('block')
    expect(bash('nook eng item check SHOP-1').kind).not.toBe('block')
  })

  test('wrappers, paths to the code and the role variables are blocked', () => {
    for (const c of [
      'env NOOK_X=1 nook eng item show A', 'exec nook eng item show A', 'echo x | xargs nook eng item show', 'eval nook eng item show A', 'sh -c "nook eng item show A"',
      'bash -lc "nook eng next"', 'bun packages/engineering/src/commands.ts item show A', '/x/apps/nook/bin/nook eng item show A', 'NOOK_ROLE=owner nook eng item approve A', 'env -u CLAUDECODE nook eng next',
    ]) {
      expect(bash(c).kind).toBe('block')
    }
    expect(bash('nook eng next # env is fine in a comment').kind).not.toBe('block')
    expect(bash("cat > note.md <<'EOF'\nexec nook eng item approve A\nEOF").kind).toBe('pass')
  })

  test('an owner move under the short name is still the owner move', () => {
    for (const c of ['nk eng item approve SHOP-1', 'nk eng item accept SHOP-1', 'nk engineering item mode SHOP-1 auto', 'echo $(nk eng item approve A)']) {
      expect(reason(bash(c))).toMatch(/owner's move/)
    }
  })

  test('an agent runs the tool as nook only: nk is blocked', () => {
    for (const c of ['nk eng next', 'nk eng item show A', 'cd work && nk doctor', 'echo `nk eng next`', 'env nk eng next', '/x/apps/nook/bin/nk eng next']) {
      expect(bash(c).kind).toBe('block')
    }
    expect(reason(bash('nk eng next'))).toBe('run the tool as `nook`: it is the one name of the tool.')
    expect(bash('echo "nk is the short name"').kind).not.toBe('block')
  })

  test('kit is not a name of the tool, so the guard lets it pass', () => {
    for (const c of ['kit eng item approve SHOP-1', 'KIT_ROLE=owner kit next']) {
      expect(bash(c).kind).toBe('pass')
    }
  })

  test('outside a home the Bash guard passes', () => {
    const outside = mkdtempSync(join(tmpdir(), 'nook-eng-out-'))
    expect(bashGuard({ cwd: outside, tool_input: { command: 'nook eng item approve A' } }).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})

describe('bashGuard: only command words count', () => {
  test('a quoted word that names a wrapper does not block a later call of the tool', () => {
    expect(bash('nook eng ask IT-1 "One status at a time, or several?" --blocking && nook eng questions IT-1').kind).not.toBe('block')
  })

  test('a path to the source of the nook as an argument does not block', () => {
    expect(bash('wc -l packages/engineering/src/guards/plan.ts').kind).toBe('pass')
    expect(bash('cd packages/engineering && grep -rn Caller src/hooks && bun test packages/engineering').kind).toBe('pass')
  })

  test('an owner move named inside a quoted string is text, not a call', () => {
    expect(bash('nook eng note add IT-1 "the owner runs nook eng item approve IT-1 next"').kind).not.toBe('block')
  })

  test.each(['time nook eng next', 'sh -c "nook eng item approve A"', 'sudo nook eng item show A'])('a wrapper around the tool still blocks: %s', command => {
    expect(reason(bash(command))).toBe('run `nook eng` by its plain name: no env, exec, xargs, eval or sh -c around the tool.')
  })

  test.each(['bun packages/engineering/src/commands.ts item show A', 'bun run apps/nook/src/main.ts eng next', './plugins/engineering/bin/nook eng next'])(
    'a run of the code of the nook by its path still blocks: %s',
    command => expect(reason(bash(command))).toBe('run `nook eng` by its plain name, not by a path to its code.'),
  )

  test.each(['echo $(nook eng item approve A)', 'echo `nook eng item accept A`', "bash <<'EOF'\nnook eng item approve A\nEOF"])('an owner move inside code that runs still blocks: %s', command => {
    expect(reason(bash(command))).toMatch(/owner's move/)
  })

  test.each(['export NOOK_ROLE=owner', 'unset CLAUDECODE', 'NOOK_ACTOR=x nook eng next'])('a command that sets a role still blocks: %s', command => {
    expect(reason(bash(command))).toBe('the role of an agent is set by nook, not by a command.')
  })
})

describe('inject: only calls that run get the flags', () => {
  test('a heredoc body that mentions the tool is written as it is', () => {
    const command = "cat > note.md <<'EOF'\nRun $(nook eng next) or (nook eng item show A).\nEOF\nnook eng next"
    expect(rewritten(bash(command))).toBe("cat > note.md <<'EOF'\nRun $(nook eng next) or (nook eng item show A).\nEOF\nnook eng --session sess-1 next")
  })

  test('a quoted string that mentions the tool keeps its text', () => {
    expect(rewritten(bash('echo "then nook eng next" && nook eng next'))).toBe('echo "then nook eng next" && nook eng --session sess-1 next')
  })

  test('a call inside a substitution or after then gets the flags', () => {
    expect(rewritten(bash('if true; then nook eng next; fi'))).toBe('if true; then nook eng --session sess-1 next; fi')
    expect(rewritten(bash('echo $(nook eng next)'))).toBe('echo $(nook eng --session sess-1 next)')
  })

  test('a flag that the model wrote is dropped only from the call', () => {
    expect(rewritten(bash('nook eng item show A --as owner && echo "--as owner"', SCOUT))).toBe(
      'nook eng --as reader --actor scout-0001 --session sess-1 item show A && echo "--as owner"',
    )
  })
})

describe('bashGuard: the role goes in front of each call of an agent', () => {
  test('a builder gets --as, --actor and --session on every segment that starts with the tool', () => {
    const result = bash('cd projects/bff && nook eng task start SHOP-1 T1; nook engineering task brief SHOP-1 T1 | head -3\nnook eng note add SHOP-1 "nook eng is fine in text"', BUILDER_AGENT)
    expect(result.kind).toBe('json')
    expect(rewritten(result)).toBe(
      'cd projects/bff && nook eng --as builder --actor backend-builder-ab12 --session sess-1 task start SHOP-1 T1; nook engineering --as builder --actor backend-builder-ab12 --session sess-1 task brief SHOP-1 T1 | head -3\nnook eng --as builder --actor backend-builder-ab12 --session sess-1 note add SHOP-1 "nook eng is fine in text"',
    )
    expect(bash('ls projects/bff', BUILDER_AGENT).kind).toBe('pass')
    expect(bash('yarn test', BUILDER_AGENT).kind).toBe('pass')
  })

  test('the lead gets only the session; without a session id nothing changes', () => {
    expect(rewritten(bash('nook eng pickup SHOP-1'))).toBe('nook eng --session sess-1 pickup SHOP-1')
    // a flag that the model wrote is dropped
    expect(rewritten(bash('nook eng item show SHOP-1 --as owner --session x', SCOUT))).toBe('nook eng --as reader --actor scout-0001 --session sess-1 item show SHOP-1')
    expect(bashGuard({ cwd: t.root, tool_input: { command: 'nook eng next' } }).kind).toBe('pass')
    expect(inject('nook eng next', { role: 'reader', actor: 'scout-0001', kind: 'reader' })).toBe('nook eng --as reader --actor scout-0001 --session - next')
    expect(normalize('nook "eng" appr\\ove')).toBe('nook eng approve')
  })
})

describe('bashGuard: a reader runs read commands only', () => {
  test('the allowlist: shell reads, git reads, the read commands of the tool; the verifier and the reviewer get theirs', () => {
    for (const c of ['ls -la', 'cat README.md | head', 'rg TODO projects/bff', 'git -C projects/bff status', 'git log --oneline', 'nook eng item show SHOP-1 --json', 'nook eng task list SHOP-1', 'nook eng next', 'nook doctor', 'nook eng item ac list SHOP-1 && nook eng questions SHOP-1']) {
      expect(bash(c, SCOUT).kind).not.toBe('block')
    }
    expect(rewritten(bash('nook eng item brief SHOP-1', SCOUT))).toBe('nook eng --as reader --actor scout-0001 --session sess-1 item brief SHOP-1')
    for (const c of ['rm -rf projects', 'nook eng task start SHOP-1 T1', 'nook eng item verify SHOP-1', 'nook eng item ac done SHOP-1 1 --evidence x --grade run', 'git checkout main', 'git -C projects/bff commit -m x', 'echo $(nook eng next)', 'cat a > b', 'find . -name x -delete', 'nook eng pickup SHOP-1', 'nook eng note add SHOP-1 x', 'yarn test', 'ls; touch x']) {
      const result = bash(c, SCOUT)
      expect(result.kind).toBe('block')
      expect(reason(result)).toMatch(/read|reader|only/)
    }
    expect(bash('nook eng item verify SHOP-1', VERIFIER).kind).toBe('json')
    expect(bash('nook eng task prove SHOP-1 T1 --files tests/a.test.sh', VERIFIER).kind).toBe('json')
    expect(bash('nook eng item ac done SHOP-1 1 --evidence x --grade run', VERIFIER).kind).toBe('block')
    expect(bash('nook eng item ac done SHOP-1 1 --evidence "the test" --grade run', REVIEWER).kind).toBe('json')
    expect(bash('nook eng item verify SHOP-1', REVIEWER).kind).toBe('block')
    expect(bash('cat x 2>/dev/null', SCOUT).kind).toBe('pass')
  })
})

describe('bashGuard: a reader and the item page', () => {
  test('a reader may print the page of an item', () => {
    expect(rewritten(bash('nook eng item page SHOP-1', SCOUT))).toBe('nook eng --as reader --actor scout-0001 --session sess-1 item page SHOP-1')
  })

  test('a reader may not write the page to a file', () => {
    const result = bash('nook eng item page SHOP-1 --out page.html', SCOUT)
    expect(reason(result)).toBe('a reader is read-only: `item page` prints the page; --out writes a file.')
  })

  test('a reader may print the page of a Markdown file, but not write it', () => {
    expect(rewritten(bash('nook eng doc page work/q.md', SCOUT))).toBe('nook eng --as reader --actor scout-0001 --session sess-1 doc page work/q.md')
    expect(reason(bash('nook eng doc page work/q.md --out q.html', SCOUT))).toBe('a reader is read-only: `doc page` prints the page; --out writes a file.')
  })
})

describe('bashGuard: a reader and the core commands', () => {
  test('the block names each read command of the core', () => {
    expect(reason(bash('nook init', SCOUT))).toBe('a reader may run only the read commands of nook (doctor, packs, where, ste, help).')
  })
})
