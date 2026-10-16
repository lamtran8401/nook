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

describe('engineeringModule: a typed /auto', () => {
  const auto = (args: string) => engineeringModule.command!(t.root, 'auto', args, 's-1')

  test('an id sets the mode of that item as the owner, with the actor owner via /auto', () => {
    t = makeHome()
    itemAt(t, 'framing')
    expect(auto('SHOP-1 keep the old export')).toEqual({ ok: true, lines: ['SHOP-1 mode auto', 'next: /spec SHOP-1'] })
    const last = t.kit(LEAD).stores.events.history('SHOP-1').at(-1)!
    expect([last.type, last.actor, last.role]).toEqual(['mode', 'owner via /auto', 'owner'])
  })

  test('a prompt makes a new item with the words as its title, and sets its mode', () => {
    t = makeHome()
    expect(auto('add a CSV export to the shipments page')).toEqual({
      ok: true,
      lines: ['IT-001 made from the prompt', 'IT-001 mode auto', 'next: /spec IT-001'],
    })
    expect(t.kit(LEAD).item('IT-001').title).toBe('add a CSV export to the shipments page')
  })

  test('a key that is no item yet makes the item with that key', () => {
    t = makeHome()
    expect(auto('SHOP-12').lines).toEqual(['SHOP-12 made from the prompt', 'SHOP-12 mode auto', 'next: /spec SHOP-12'])
  })

  test('no words take the one open item', () => {
    t = makeHome()
    itemAt(t, 'framing')
    expect(auto('').lines[0]).toBe('SHOP-1 mode auto')
  })

  test('no words with two open items names them and sets no mode', () => {
    t = makeHome()
    itemAt(t, 'framing')
    itemAt(t, 'framing', 'SHOP-2')
    expect(auto('')).toEqual({ ok: false, lines: ['several open items: type /auto with one of SHOP-1, SHOP-2'] })
    expect(t.kit(LEAD).item('SHOP-1').mode).toBe('normal')
  })

  test('an item that is not open is refused', () => {
    t = makeHome()
    itemAt(t, 'framing')
    t.kit(LEAD).moveItem('cancel', 'SHOP-1', { reason: 'not worth it' })
    expect(auto('SHOP-1')).toEqual({ ok: false, lines: ['SHOP-1 is cancelled: /auto runs an open item'] })
  })
})

describe('engineeringModule: the daily brief', () => {
  test('gives the waits of the owner first, what is done since the time, and what runs', () => {
    t = makeHome()
    readyToApprove(t)
    itemAt(t, 'planning', 'SHOP-2')
    const lead = t.kit(LEAD)
    lead.ledger.run("UPDATE item SET state = 'done' WHERE id = 'SHOP-2'")
    lead.ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-2', 'accept', 'checking', 'done', 'owner', 'owner', '2026-10-16T09:00:00.000Z')")
    lead.newItem({ id: 'SHOP-3', title: 'the new export', areas: ['bff'] })
    expect(engineeringModule.brief!(t.root, new Date('2026-10-15T00:00:00.000Z'))).toEqual([
      { part: 'waits', urgent: true, text: 'SHOP-1 waits for your approve: the export date is off', action: '/gate approve SHOP-1' },
      { part: 'done', text: 'SHOP-2 accepted: the export date is off' },
      { part: 'runs', text: 'SHOP-3 backlog: the new export', action: '/spec SHOP-3' },
    ])
  })
})
