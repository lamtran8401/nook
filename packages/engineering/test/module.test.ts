import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { engineeringModule } from '../src/module.ts'
import { itemAt, LEAD, makeHome, PLAN, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
afterEach(() => t.cleanup())

const clearFolders = () => {
  for (const folder of ['work', 'backlog', 'docs/adr']) rmSync(join(t.root, folder), { recursive: true, force: true })
}

describe('engineeringModule', () => {
  test('setup makes work/, backlog/ and docs/adr/ in its home and names each one', () => {
    t = makeHome()
    clearFolders()
    expect(engineeringModule.setup(t.root)).toEqual(['work/', 'backlog/', 'docs/adr/'])
    expect(['work', 'backlog', 'docs/adr'].map(f => existsSync(join(t.root, f)))).toEqual([true, true, true])
  })

  test('a second setup makes nothing', () => {
    t = makeHome()
    engineeringModule.setup(t.root)
    expect(engineeringModule.setup(t.root)).toEqual([])
  })

  test('setup in a child folder does not touch the home of its parent', () => {
    t = makeHome()
    clearFolders()
    const child = join(t.root, 'projects', 'notes')
    mkdirSync(child, { recursive: true })
    writeFileSync(join(child, 'kit.yml'), 'packs: []\n')
    expect(engineeringModule.setup(child)).toEqual([])
    expect(existsSync(join(t.root, 'work'))).toBe(false)
  })

  test('a home with no engineering section in kit.yml is not configured', () => {
    t = makeHome({ section: false })
    expect(engineeringModule.configured(t.root)).toBe(false)
  })

  test('a home with its areas in kit.yml is configured', () => {
    t = makeHome()
    expect(engineeringModule.configured(t.root)).toBe(true)
  })

  test('doctor names a missing folder with the fix to run kit init --update', () => {
    t = makeHome()
    clearFolders()
    expect(engineeringModule.doctor(t.root)).toContainEqual({ level: 'warn', where: t.root, text: 'work/ is missing', fix: 'kit init --update' })
  })
})

/** An item in planning whose plan and slices are written and imported, so the approve has no gap. */
function readyToApprove(t: TestHome) {
  itemAt(t, 'planning')
  writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
  writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
  t.kit(LEAD).importTasks('SHOP-1')
}

describe('engineeringModule: the owner moves of /gate', () => {
  test('approve runs as the owner, moves the item to ready, and names the next step', () => {
    t = makeHome()
    readyToApprove(t)
    expect(engineeringModule.gate!(t.root, ['approve', 'SHOP-1'], 's-1')).toEqual({ ok: true, lines: ['SHOP-1 is ready', 'next: /cook SHOP-1'] })
  })

  test('the ledger records the move with the actor owner via /gate', () => {
    t = makeHome()
    readyToApprove(t)
    engineeringModule.gate!(t.root, ['approve', 'SHOP-1'], 's-1')
    const last = t.kit(LEAD).stores.events.history('SHOP-1').at(-1)!
    expect([last.type, last.actor, last.role]).toEqual(['approve', 'owner via /gate', 'owner'])
  })

  test('a move with a gap is refused with the gaps and changes nothing', () => {
    t = makeHome()
    itemAt(t, 'planning')
    const result = engineeringModule.gate!(t.root, ['approve', 'SHOP-1'], 's-1')
    expect(result.ok).toBe(false)
    expect(result.lines[0]).toMatch(/^approve SHOP-1: \d+ gaps?/)
    expect(t.kit(LEAD).item('SHOP-1').state).toBe('planning')
  })

  test('mode sets the mode of the item as the owner', () => {
    t = makeHome()
    itemAt(t, 'planning')
    expect(engineeringModule.gate!(t.root, ['mode', 'SHOP-1', 'auto'], 's-1')).toEqual({ ok: true, lines: ['SHOP-1 mode auto'] })
  })

  test('a move with no id asks for it', () => {
    t = makeHome()
    expect(engineeringModule.gate!(t.root, ['accept'], 's-1')).toEqual({ ok: false, lines: ['give the item: /gate accept <id>'] })
  })

  test('waiting lists the approve of an item whose plan has no gap', () => {
    t = makeHome()
    readyToApprove(t)
    expect(engineeringModule.waiting!(t.root)).toEqual([{ words: 'approve SHOP-1', why: 'SHOP-1 is planning, no gap' }])
  })
})
