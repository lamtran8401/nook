import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookInput } from '@nook/shared/hook.ts'

import { editGuard, editLog } from '../src/hooks/edit-guard.ts'
import { BUILDER, itemAt, LEAD, makeHome, OWNER, PLAN, SPEC, TASKS, type TestHome, writeDoc } from './helpers.ts'
import { BUILDER_AGENT, reason, SCOUT } from './hook-inputs.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

const edit = (file: string, extra: Partial<HookInput> = {}) => editGuard({ cwd: t.root, session_id: 'sess-1', tool_name: 'Edit', tool_input: { file_path: file, new_string: 'x' }, ...extra })

describe('editGuard', () => {
  test('a reader cannot write; a builder edits only in the area of its own running slice; the lead edits any area', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff', 'web'] }), TASKS([{ id: 'T1' }, { id: 'T2', area: 'web' }]))
    const lead = t.eng(LEAD)
    expect(reason(edit('projects/bff/src/a.ts', SCOUT))).toContain('reader')
    expect(edit('projects/bff/src/a.ts').kind).toBe('pass')
    expect(reason(edit('projects/bff/src/a.ts', BUILDER_AGENT))).toContain('a builder edits only in the area of its own slice')
    t.eng(BUILDER).moveSlice('start', 'SHOP-1', 'T1')
    expect(edit('projects/bff/src/a.ts', BUILDER_AGENT).kind).toBe('pass')
    expect(edit(join(t.root, 'projects/bff/deep/b.ts'), BUILDER_AGENT).kind).toBe('pass')
    lead.moveSlice('start', 'SHOP-1', 'T2')
    expect(reason(edit('projects/web/src/a.ts', BUILDER_AGENT))).toContain('a builder edits only in the area of its own slice')
    expect(edit('projects/web/src/a.ts').kind).toBe('pass')
    expect(edit('README.md').kind).toBe('pass')
    expect(edit('backlog/SHOP-1/ticket.md').kind).toBe('pass')
    expect(edit('docs/adr/0001-x.md', BUILDER_AGENT).kind).toBe('pass')
  })

  test('the documents of an item open in every stage; a builder never edits them; a file the item folder does not hold is refused', () => {
    itemAt(t, 'framing')
    expect(edit('works/SHOP-1/spec.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/plan.md').kind).toBe('pass')
    expect(reason(edit('works/SHOP-1/spec.md', BUILDER_AGENT))).toContain('builder')
    expect(reason(edit('works/SHOP-9/spec.md'))).toContain('no item SHOP-9')
    expect(edit('works/SHOP-1/findings.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/walkthrough.html').kind).toBe('pass')
    expect(edit('works/SHOP-1/notes.md').kind).toBe('block')
    writeDoc(t, 'SHOP-1', 'spec.md', SPEC())
    writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
    writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
    t.eng(LEAD).moveItem('agree', 'SHOP-1')
    t.eng(LEAD).importTasks('SHOP-1')
    t.eng(OWNER).moveItem('approve', 'SHOP-1')
    expect(edit('works/SHOP-1/plan.md').kind).toBe('pass')
    expect(edit('works/SHOP-1/spec.md').kind).toBe('pass')
  })

  test('outside a home the Edit guard passes', () => {
    const outside = mkdtempSync(join(tmpdir(), 'nook-eng-out-'))
    expect(editGuard({ cwd: outside, tool_input: { file_path: 'a.ts' } }).kind).toBe('pass')
    rmSync(outside, { recursive: true, force: true })
  })
})

describe('editLog', () => {
  const log = (file: string, extra: Partial<HookInput> = {}) => editLog({ cwd: t.root, session_id: 'sess-1', tool_name: 'Edit', tool_input: { file_path: file, new_string: 'x' }, ...extra })
  const edits = (id = 'SHOP-1') => t.eng(LEAD).stores.events.history(id).filter(e => e.type === 'edit').map(e => e.reason)

  test('an area file that changes with no running slice is logged once on the item that holds the area', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff'] }), TASKS([{ id: 'T1' }]))
    expect(log('projects/bff/src/a.ts').kind).toBe('pass')
    log(join(t.root, 'projects/bff/src/a.ts'))
    expect(edits()).toEqual(['outside a slice: projects/bff/src/a.ts'])
  })

  test('an edit inside a running slice, outside every area or with no item that holds the area is not logged', () => {
    itemAt(t, 'cooking', 'SHOP-1', SPEC({ areas: ['bff'] }), TASKS([{ id: 'T1' }]))
    t.eng(BUILDER).moveSlice('start', 'SHOP-1', 'T1')
    log('projects/bff/src/a.ts')
    log('README.md')
    log('projects/web/src/a.ts')
    expect(edits()).toEqual([])
  })
})
