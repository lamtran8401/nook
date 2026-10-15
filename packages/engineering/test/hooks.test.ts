import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookInput, HookResult } from '@kit/shared/hook.ts'

import { bashGuard, callerOf, editGuard, inject, MAX_HOLDS, normalize, sessionStart, stopHook, subagentStop, teammateIdle } from '../src/hooks.ts'
import { verify } from '../src/model/checks.ts'
import { markCriterion } from '../src/model/criteria.ts'
import { setMode } from '../src/model/items.ts'
import { moveItem } from '../src/model/moves.ts'
import { ask, answer } from '../src/model/questions.ts'
import { importTasks, moveSlice } from '../src/model/slices.ts'
import { pickup } from '../src/report.ts'
import { BUILDER, itemAt, LEAD, makeHome, OWNER, PLAN, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const BUILDER_AGENT = { agent_type: 'kit-engineering:backend-builder', agent_id: 'agent-ab12' }
const VERIFIER = { agent_type: 'kit-engineering:verifier', agent_id: 'agent-cd34' }
const REVIEWER = { agent_type: 'kit-engineering:reviewer', agent_id: 'agent-ef56' }
const SCOUT = { agent_type: 'scout', agent_id: 'agent-0001' }

const bash = (command: string, extra: Partial<HookInput> = {}) => bashGuard({ cwd: t.root, session_id: 'sess-1', tool_name: 'Bash', tool_input: { command }, ...extra })
const edit = (file: string, extra: Partial<HookInput> = {}) => editGuard({ cwd: t.root, session_id: 'sess-1', tool_name: 'Edit', tool_input: { file_path: file, new_string: 'x' }, ...extra })
const stop = (extra: Partial<HookInput> = {}) => stopHook({ cwd: t.root, session_id: 'sess-1', hook_event_name: 'Stop', ...extra })
const reason = (r: HookResult) => (r.kind === 'block' ? r.reason : r.kind === 'json' ? JSON.stringify(r.value) : '')
const rewritten = (r: HookResult) => (r.kind === 'json' ? String((r.value.hookSpecificOutput as { updatedInput: { command: string } }).updatedInput.command) : null)

describe('the caller', () => {
  test('no agent type is the lead; a type that ends in builder is a builder; others are readers with their kind', () => {
    expect(callerOf({})).toEqual({ role: 'lead', actor: 'lead', kind: 'lead' })
    expect(callerOf(BUILDER_AGENT)).toEqual({ role: 'builder', actor: 'backend-builder-ab12', kind: 'builder' })
    expect(callerOf({ agent_type: 'frontend-builder', agent_id: 'x9' })).toMatchObject({ role: 'builder', actor: 'frontend-builder-x9' })
    // an in-process teammate can come with an id and no type: it is a builder, never the lead
    expect(callerOf({ agent_id: 'team-77ab' })).toEqual({ role: 'builder', actor: 'teammate-builder-77ab', kind: 'builder' })
    expect(callerOf(VERIFIER)).toMatchObject({ role: 'reader', kind: 'verifier' })
    expect(callerOf(REVIEWER)).toMatchObject({ role: 'reader', kind: 'reviewer' })
    expect(callerOf({ agent_type: 'kit-engineering:code-reviewer', agent_id: 'a' })).toMatchObject({ role: 'reader', kind: 'reader' })
    expect(callerOf(SCOUT)).toMatchObject({ role: 'reader', kind: 'reader', actor: 'scout-0001' })
  })
})

describe('E-13 the Bash guard blocks the owner moves in any spelling', () => {
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

  test('outside a home every hook passes', () => {
    const outside = mkdtempSync(join(tmpdir(), 'kit-eng-out-'))
    expect(bashGuard({ cwd: outside, tool_input: { command: 'kit eng item approve A' } }).kind).toBe('pass')
    expect(editGuard({ cwd: outside, tool_input: { file_path: 'a.ts' } }).kind).toBe('pass')
    expect(stopHook({ cwd: outside, session_id: 's' }).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})

describe('the role goes in front of each call of an agent', () => {
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

describe('a reader runs read commands only', () => {
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

describe('the Edit guard', () => {
  test('a reader cannot write; a builder edits only in the area of its running slice; the lead needs a running slice in the area', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff', 'web'] }), TASKS([{ id: 'T1' }, { id: 'T2', area: 'web' }]))
    const lead = t.kit(LEAD)
    expect(reason(edit('projects/bff/src/a.ts', SCOUT))).toContain('reader')
    expect(reason(edit('projects/bff/src/a.ts'))).toContain('no item in cooking with a running slice')
    moveSlice(t.kit(BUILDER), 'start', 'SHOP-1', 'T1')
    expect(edit('projects/bff/src/a.ts').kind).toBe('pass')
    expect(edit('projects/bff/src/a.ts', BUILDER_AGENT).kind).toBe('pass')
    expect(edit(join(t.root, 'projects/bff/deep/b.ts'), BUILDER_AGENT).kind).toBe('pass')
    expect(reason(edit('projects/web/src/a.ts', BUILDER_AGENT))).toContain('no item in cooking with a running slice')
    moveSlice(lead, 'start', 'SHOP-1', 'T2')
    expect(reason(edit('projects/web/src/a.ts', BUILDER_AGENT))).toContain('a builder edits only in the area of its own slice')
    expect(edit('projects/web/src/a.ts', { agent_type: 'frontend-builder', agent_id: 'lead' }).kind).toBe('block')
    // files outside the areas and outside work/ are free
    expect(edit('README.md').kind).toBe('pass')
    expect(edit('backlog/SHOP-1/ticket.md').kind).toBe('pass')
    expect(edit('docs/adr/0001-x.md', BUILDER_AGENT).kind).toBe('pass')
  })

  test('the documents open in their stage only; the free documents always; a builder never', () => {
    itemAt(t, 'framing')
    expect(edit('work/SHOP-1/spec.md').kind).toBe('pass')
    expect(reason(edit('work/SHOP-1/plan.md'))).toContain('plan.md opens only in planning')
    expect(reason(edit('work/SHOP-1/spec.md', BUILDER_AGENT))).toContain('builder')
    expect(reason(edit('work/SHOP-9/spec.md'))).toContain('no item SHOP-9')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    moveItem(t.kit(LEAD), 'agree', 'SHOP-1')
    expect(reason(edit('work/SHOP-1/spec.md'))).toBe('SHOP-1 is planning: spec.md opens only in framing (kit eng item reframe SHOP-1 --reason "<why>").')
    expect(edit('work/SHOP-1/plan.md').kind).toBe('pass')
    expect(edit('work/SHOP-1/tasks.md').kind).toBe('pass')
    expect(edit('work/SHOP-1/findings.md').kind).toBe('pass')
    expect(edit('work/SHOP-1/handoff.md').kind).toBe('pass')
    expect(edit('work/SHOP-1/walkthrough.html').kind).toBe('pass')
    expect(edit('work/SHOP-1/notes.md').kind).toBe('block')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(t.kit(LEAD), 'SHOP-1')
    moveItem(t.kit(OWNER), 'approve', 'SHOP-1')
    expect(reason(edit('work/SHOP-1/plan.md'))).toContain('plan.md opens only in planning (kit eng item replan SHOP-1')
  })
})

describe('E-22 the Stop hook drives an auto run and holds on a blocking question', () => {
  test('a blocking question holds the lead of the item until it is answered', () => {
    itemAt(t, 'framing')
    const lead = t.kit(LEAD)
    expect(stop().kind).toBe('pass')
    pickup(lead, 'SHOP-1')
    expect(stop().kind).toBe('pass')
    ask(lead, 'SHOP-1', 'which zone?', true)
    const held = stop()
    expect(held.kind).toBe('json')
    expect(reason(held)).toContain('blocking question Q1 is open')
    expect(reason(held)).toContain('"decision":"block"')
    answer(lead, 'SHOP-1', 'Q1', 'UTC')
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
  })

  test('mode auto: the next stage of the lead, the proceed step, the owner stages let go, 6 holds at most', () => {
    itemAt(t, 'framing')
    const lead = t.kit(LEAD)
    const owner = t.kit(OWNER)
    pickup(lead, 'SHOP-1')
    expect(stop().kind).toBe('pass')
    setMode(owner, 'SHOP-1', 'auto')
    expect(reason(stop())).toContain('skills/spec/SKILL.md')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    moveItem(lead, 'agree', 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/recipe/SKILL.md')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    importTasks(lead, 'SHOP-1')
    const ready = reason(stop({ stop_hook_active: true }))
    expect(ready).toContain('kit eng item proceed SHOP-1')
    expect(ready).toContain('skills/cook/SKILL.md')
    moveItem(lead, 'proceed', 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/cook/SKILL.md')
    t.git('bff', 'switch', '-q', '-c', 'kit/SHOP-1-x')
    moveItem(lead, 'begin', 'SHOP-1')
    moveSlice(lead, 'start', 'SHOP-1', 'T1')
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
    moveSlice(lead, 'done', 'SHOP-1', 'T1', { files: ['a'] })
    verify(lead, 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/cook/SKILL.md')
    moveItem(lead, 'submit', 'SHOP-1')
    expect(reason(stop({ stop_hook_active: true }))).toContain('skills/check/SKILL.md')
    markCriterion(lead, 'SHOP-1', 1, 'x', 'run')
    markCriterion(lead, 'SHOP-1', 2, 'y', 'run')
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
    // the owner accepts outside the session; the run ends
    moveItem(owner, 'accept', 'SHOP-1')
    expect(stop().kind).toBe('pass')
  })

  test('a stuck lead is let go after MAX_HOLDS holds, then the count starts again', () => {
    itemAt(t, 'framing')
    const lead = t.kit(LEAD)
    pickup(lead, 'SHOP-1')
    setMode(t.kit(OWNER), 'SHOP-1', 'auto')
    for (let i = 1; i <= MAX_HOLDS; i++) expect(reason(stop({ stop_hook_active: i > 1 }))).toContain(`hold ${i} of ${MAX_HOLDS}`)
    expect(stop({ stop_hook_active: true }).kind).toBe('pass')
    expect(reason(stop())).toContain(`hold 1 of ${MAX_HOLDS}`)
  })

  test('the single item in an auto run is found with no session row; a builder with a running slice is held once', () => {
    itemAt(t, 'cooking')
    const lead = t.kit(LEAD)
    setMode(t.kit(OWNER), 'SHOP-1', 'auto')
    expect(reason(stop({ session_id: 'another' }))).toContain('skills/cook/SKILL.md')
    moveSlice(t.kit(BUILDER), 'start', 'SHOP-1', 'T1')
    const held = subagentStop({ cwd: t.root, ...BUILDER_AGENT })
    expect(reason(held)).toContain('kit eng task done SHOP-1 T1')
    expect(subagentStop({ cwd: t.root, ...BUILDER_AGENT, stop_hook_active: true }).kind).toBe('pass')
    expect(subagentStop({ cwd: t.root, agent_type: 'frontend-builder', agent_id: 'zz99' }).kind).toBe('pass')
    expect(subagentStop({ cwd: t.root, ...SCOUT }).kind).toBe('pass')
    // a teammate named <area>-builder is held on the running slice of its area; exit 2 is the only form TeammateIdle honors
    const idle = teammateIdle({ cwd: t.root, teammate_name: 'bff-builder', team_name: 'kit' })
    expect(idle.kind).toBe('block')
    expect((idle as { reason: string }).reason).toContain('kit eng task done')
    expect(teammateIdle({ cwd: t.root, teammate_name: 'frontend-builder' }).kind).toBe('pass')
    expect(teammateIdle({ cwd: t.root, teammate_name: 'scout' }).kind).toBe('pass')
    moveSlice(lead, 'done', 'SHOP-1', 'T1', { files: ['a'] })
    expect(subagentStop({ cwd: t.root, ...BUILDER_AGENT }).kind).toBe('pass')
  })
})

describe('SessionStart', () => {
  test('adds the first lines of next', () => {
    itemAt(t, 'framing')
    const result = sessionStart({ cwd: t.root })
    expect(result.kind).toBe('json')
    expect(reason(result)).toContain('Nothing waits for you.')
    expect(reason(result)).toContain('/spec SHOP-1')
  })
})
