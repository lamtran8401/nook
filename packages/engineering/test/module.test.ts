import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { engineeringModule } from '../src/module.ts'
import { itemAt, LEAD, makeHome, PLAN, TASKS, type TestHome, writeDoc } from './helpers.ts'

let t: TestHome
afterEach(() => t.cleanup())

const clearFolders = () => {
  for (const folder of ['work', 'works', 'backlog', 'docs/adr']) rmSync(join(t.root, folder), { recursive: true, force: true })
}

describe('engineeringModule', () => {
  test('setup makes works/, backlog/ and docs/adr/ in its home and names each one', () => {
    t = makeHome()
    clearFolders()
    expect(engineeringModule.setup(t.root)).toEqual(['works/', 'backlog/', 'docs/adr/'])
    expect(['works', 'backlog', 'docs/adr'].map(f => existsSync(join(t.root, f)))).toEqual([true, true, true])
  })

  test('setup moves the work/ of an older Nook to works/ and names the move', () => {
    t = makeHome({ dir: null })
    clearFolders()
    mkdirSync(join(t.root, 'work', 'SHOP-1'), { recursive: true })
    writeFileSync(join(t.root, 'work', 'SHOP-1', 'spec.md'), '# Spec\n')
    expect(engineeringModule.setup(t.root)).toEqual(['work/ → works/', 'backlog/', 'docs/adr/'])
    expect(existsSync(join(t.root, 'works', 'SHOP-1', 'spec.md'))).toBe(true)
    expect(existsSync(join(t.root, 'work'))).toBe(false)
  })

  test('setup keeps work/ when nook.yml names it as the item folder', () => {
    t = makeHome({ dir: 'work' })
    engineeringModule.setup(t.root)
    expect([existsSync(join(t.root, 'work')), existsSync(join(t.root, 'works'))]).toEqual([true, false])
  })

  test('records names the item folder and the backlog of the home', () => {
    t = makeHome()
    expect(engineeringModule.records!(t.root)).toEqual([join(t.root, 'works'), join(t.root, 'backlog')])
  })

  test('doctor names a work/ beside works/, with the fix', () => {
    t = makeHome({ dir: null })
    mkdirSync(join(t.root, 'work'), { recursive: true })
    expect(engineeringModule.doctor(t.root)).toContainEqual({ level: 'warn', where: t.root, text: 'work/ and works/ both exist: the items live in works/', fix: 'move each folder of work/ into works/, then delete work/' })
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
    writeFileSync(join(child, 'nook.yml'), 'packs: []\n')
    expect(engineeringModule.setup(child)).toEqual([])
    expect(existsSync(join(t.root, 'works'))).toBe(false)
  })

  test('a home with no engineering section in nook.yml is not configured', () => {
    t = makeHome({ section: false })
    expect(engineeringModule.configured(t.root)).toBe(false)
  })

  test('a home with its areas in nook.yml is configured', () => {
    t = makeHome()
    expect(engineeringModule.configured(t.root)).toBe(true)
  })

  test('doctor names a missing folder with the fix to run nook init --update', () => {
    t = makeHome()
    clearFolders()
    expect(engineeringModule.doctor(t.root)).toContainEqual({ level: 'warn', where: t.root, text: 'works/ is missing', fix: 'nook init --update' })
  })
})

/** An item in planning whose plan and slices are written and imported, so the approve has no gap. */
function readyToApprove(t: TestHome) {
  itemAt(t, 'planning')
  writeDoc(t, 'SHOP-1', 'plan.md', PLAN)
  writeDoc(t, 'SHOP-1', 'tasks.md', TASKS([{ id: 'T1' }]))
  t.eng(LEAD).importTasks('SHOP-1')
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
    const last = t.eng(LEAD).stores.events.history('SHOP-1').at(-1)!
    expect([last.type, last.actor, last.role]).toEqual(['approve', 'owner via /gate', 'owner'])
  })

  test('a move with a gap is refused with the gaps and changes nothing', () => {
    t = makeHome()
    itemAt(t, 'planning')
    const result = engineeringModule.gate!(t.root, ['approve', 'SHOP-1'], 's-1')
    expect(result.ok).toBe(false)
    expect(result.lines[0]).toMatch(/^approve SHOP-1: \d+ gaps?/)
    expect(t.eng(LEAD).item('SHOP-1').state).toBe('planning')
  })

  test('mode sets the mode of the item as the owner', () => {
    t = makeHome()
    itemAt(t, 'planning')
    expect(engineeringModule.gate!(t.root, ['mode', 'SHOP-1', 'yolo'], 's-1')).toEqual({ ok: true, lines: ['SHOP-1 mode yolo'] })
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

describe('engineeringModule: a typed /yolo', () => {
  const yolo = (args: string) => engineeringModule.command!(t.root, 'yolo', args, 's-1')

  test('an id sets the mode of that item as the owner, with the actor owner via /yolo', () => {
    t = makeHome()
    itemAt(t, 'framing')
    expect(yolo('SHOP-1 keep the old export')).toEqual({ ok: true, lines: ['SHOP-1 mode yolo', 'next: /spec SHOP-1'] })
    const last = t.eng(LEAD).stores.events.history('SHOP-1').at(-1)!
    expect([last.type, last.actor, last.role]).toEqual(['mode', 'owner via /yolo', 'owner'])
  })

  test('a prompt makes a new item with the words as its title, and sets its mode', () => {
    t = makeHome()
    expect(yolo('add a CSV export to the shipments page')).toEqual({
      ok: true,
      lines: ['IT-001 made from the prompt', 'IT-001 mode yolo', 'next: /spec IT-001'],
    })
    expect(t.eng(LEAD).item('IT-001').title).toBe('add a CSV export to the shipments page')
  })

  test('a key that is no item yet makes the item with that key', () => {
    t = makeHome()
    expect(yolo('SHOP-12').lines).toEqual(['SHOP-12 made from the prompt', 'SHOP-12 mode yolo', 'next: /spec SHOP-12'])
  })

  test('a key typed with a space or in lower case names that key, never a new item from the words', () => {
    t = makeHome()
    itemAt(t, 'framing', 'BKM-14478')
    expect(yolo('BKM 14478').lines).toEqual(['BKM-14478 mode yolo', 'next: /spec BKM-14478'])
    expect(yolo('bkm-14478').lines[0]).toBe('BKM-14478 mode yolo')
    expect(t.eng(LEAD).stores.items.list().map(i => i.id)).toEqual(['BKM-14478'])
  })

  test('a lower-case prompt that holds a number stays a prompt', () => {
    t = makeHome()
    expect(yolo('add 2 buttons to the export').lines[0]).toBe('IT-001 made from the prompt')
  })

  test('no words take the one open item', () => {
    t = makeHome()
    itemAt(t, 'framing')
    expect(yolo('').lines[0]).toBe('SHOP-1 mode yolo')
  })

  test('no words with two open items names them and sets no mode', () => {
    t = makeHome()
    itemAt(t, 'framing')
    itemAt(t, 'framing', 'SHOP-2')
    expect(yolo('')).toEqual({ ok: false, lines: ['several open items: type /yolo with one of SHOP-1, SHOP-2'] })
    expect(t.eng(LEAD).item('SHOP-1').mode).toBe('normal')
  })

  test('an item that is not open is refused', () => {
    t = makeHome()
    itemAt(t, 'framing')
    t.eng(LEAD).moveItem('cancel', 'SHOP-1', { reason: 'not worth it' })
    expect(yolo('SHOP-1')).toEqual({ ok: false, lines: ['SHOP-1 is cancelled: /yolo runs an open item'] })
  })
})

describe('engineeringModule: the retro', () => {
  test('gives the facts of the ledger since the time', () => {
    t = makeHome()
    itemAt(t, 'planning')
    t.eng(LEAD).ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, reason, at) VALUES ('SHOP-1', 'reject', 'review', 'cooking', 'lead', 'lead', 'AC 4 has no test', '2026-10-16T09:00:00.000Z')")
    expect(engineeringModule.retro!(t.root, new Date('2026-10-15T00:00:00.000Z'))).toEqual([
      { item: 'SHOP-1', kind: 'sent back', text: 'AC 4 has no test', at: '2026-10-16T09:00:00.000Z' },
    ])
  })
})

describe('engineeringModule: the daily brief', () => {
  test('gives the waits of the owner first, what is done since the time, and what runs, each with its item', () => {
    t = makeHome()
    readyToApprove(t)
    itemAt(t, 'planning', 'SHOP-2')
    const lead = t.eng(LEAD)
    lead.ledger.run("UPDATE item SET state = 'done' WHERE id = 'SHOP-2'")
    lead.ledger.run("INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-2', 'accept', 'review', 'done', 'owner', 'owner', '2026-10-16T09:00:00.000Z')")
    lead.newItem({ id: 'SHOP-3', title: 'the new export', areas: ['bff'] })
    expect(engineeringModule.brief!(t.root, new Date('2026-10-15T00:00:00.000Z'))).toEqual([
      { part: 'waits', urgent: true, text: 'SHOP-1 waits for your approve: the export date is off', action: '/gate approve SHOP-1', item: { id: 'SHOP-1', title: 'the export date is off', state: 'planning' } },
      { part: 'waits', urgent: false, text: 'SHOP-2 is done and waits for its close: the export date is off', action: '/close SHOP-2', item: { id: 'SHOP-2', title: 'the export date is off', state: 'done' } },
      { part: 'done', text: 'SHOP-2 accepted: the export date is off', item: { id: 'SHOP-2', title: 'the export date is off', state: 'done' } },
      { part: 'runs', text: 'SHOP-3 backlog: the new export', action: '/spec SHOP-3', item: { id: 'SHOP-3', title: 'the new export', state: 'backlog' } },
    ])
  })
})

describe('engineeringModule: the reads of doctor, brief, retro and waiting', () => {
  const MIGRATE = 'run any `nook eng` command in the desk'
  const dropLastMigration = () => {
    const lead = t.eng(LEAD)
    lead.ledger.run('DELETE FROM migration WHERE n = (SELECT MAX(n) FROM migration)')
    return () => lead.ledger.get<{ n: number }>('SELECT COUNT(*) AS n FROM migration')!.n
  }

  test('doctor of a ledger that needs a migration names the gap with its fix, and runs no migration', () => {
    t = makeHome()
    itemAt(t, 'planning')
    const migrations = dropLastMigration()
    const before = migrations()
    expect(engineeringModule.doctor(t.root)).toContainEqual({ level: 'error', where: t.root, text: 'the ledger needs 1 migration', fix: MIGRATE })
    expect(migrations()).toBe(before)
  })

  test('brief, retro and waiting of a ledger that needs a migration give nothing, and run no migration', () => {
    t = makeHome()
    itemAt(t, 'planning')
    const migrations = dropLastMigration()
    const before = migrations()
    expect(engineeringModule.brief!(t.root, new Date(0))).toEqual([])
    expect(engineeringModule.retro!(t.root, new Date(0))).toEqual([])
    expect(engineeringModule.waiting!(t.root)).toEqual([])
    expect(migrations()).toBe(before)
  })

  test('doctor of a home with no ledger yet names the gap, and makes no ledger', () => {
    t = makeHome()
    expect(engineeringModule.doctor(t.root)).toContainEqual({ level: 'error', where: t.root, text: `no ledger at ${t.home.dbFile}`, fix: MIGRATE })
    expect(existsSync(t.home.dbFile)).toBe(false)
  })
})
