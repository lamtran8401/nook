import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookInput } from '@nook/shared/hook.ts'

import { editGuard } from '../src/hooks/edit-guard.ts'
import { BUILDER, itemAt, LEAD, makeHome, OWNER, PLAN, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'
import { BUILDER_AGENT, reason, SCOUT } from './hook-inputs.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const edit = (file: string, extra: Partial<HookInput> = {}) => editGuard({ cwd: t.root, session_id: 'sess-1', tool_name: 'Edit', tool_input: { file_path: file, new_string: 'x' }, ...extra })

describe('editGuard', () => {
  test('a reader cannot write; a builder edits only in the area of its running slice; the lead needs a running slice in the area', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff', 'web'] }), TASKS([{ id: 'T1' }, { id: 'T2', area: 'web' }]))
    const lead = t.eng(LEAD)
    expect(reason(edit('projects/bff/src/a.ts', SCOUT))).toContain('reader')
    expect(reason(edit('projects/bff/src/a.ts'))).toContain('no item in cooking with a running slice')
    t.eng(BUILDER).moveSlice('start', 'SHOP-1', 'T1')
    expect(edit('projects/bff/src/a.ts').kind).toBe('pass')
    expect(edit('projects/bff/src/a.ts', BUILDER_AGENT).kind).toBe('pass')
    expect(edit(join(t.root, 'projects/bff/deep/b.ts'), BUILDER_AGENT).kind).toBe('pass')
    expect(reason(edit('projects/web/src/a.ts', BUILDER_AGENT))).toContain('no item in cooking with a running slice')
    lead.moveSlice('start', 'SHOP-1', 'T2')
    expect(reason(edit('projects/web/src/a.ts', BUILDER_AGENT))).toContain('a builder edits only in the area of its own slice')
    expect(edit('projects/web/src/a.ts', { agent_type: 'frontend-builder', agent_id: 'lead' }).kind).toBe('block')
    // files outside the areas and outside works/ are free
    expect(edit('README.md').kind).toBe('pass')
    expect(edit('backlog/SHOP-1/ticket.md').kind).toBe('pass')
    expect(edit('docs/adr/0001-x.md', BUILDER_AGENT).kind).toBe('pass')
  })

  test('the documents open in their stage only; the free documents always; a builder never', () => {
    itemAt(t, 'framing')
    expect(edit('works/SHOP-1/spec.md').kind).toBe('pass')
    expect(reason(edit('works/SHOP-1/plan.md'))).toContain('plan.md opens only in planning')
    expect(reason(edit('works/SHOP-1/spec.md', BUILDER_AGENT))).toContain('builder')
    expect(reason(edit('works/SHOP-9/spec.md'))).toContain('no item SHOP-9')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    t.eng(LEAD).moveItem('agree', 'SHOP-1')
    expect(reason(edit('works/SHOP-1/spec.md'))).toBe('SHOP-1 is planning: spec.md opens only in framing (nook eng item reframe SHOP-1 --reason "<why>").')
    expect(edit('works/SHOP-1/plan.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/tasks.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/findings.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/handoff.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/walkthrough.html').kind).toBe('pass')
    expect(edit('works/SHOP-1/notes.md').kind).toBe('block')
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    t.eng(LEAD).importTasks('SHOP-1')
    t.eng(OWNER).moveItem('approve', 'SHOP-1')
    expect(reason(edit('works/SHOP-1/plan.md'))).toContain('plan.md opens only in planning (nook eng item replan SHOP-1')
  })

  test('outside a home the Edit guard passes', () => {
    const outside = mkdtempSync(join(tmpdir(), 'nook-eng-out-'))
    expect(editGuard({ cwd: outside, tool_input: { file_path: 'a.ts' } }).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})
