import { Database } from 'bun:sqlite'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { Ledger } from '../src/ledger.ts'
import { MIGRATIONS } from '../src/migrations.ts'

let dir: string
let ledger: Ledger
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-ledger-'))
  ledger = Ledger.open(join(dir, 'state', 'engineering.db'))
})
afterEach(() => {
  ledger.close()
  rmSync(dir, { recursive: true, force: true })
})

const addItem = (id: string) =>
  ledger.run("INSERT INTO item (id, title, state, created, updated) VALUES (?, 'x', 'backlog', 'now', 'now')", id)
/** A ledger as the first migration left it, with `rows` written into it. */
function writeFirstSchema(file: string, rows: string[]): void {
  mkdirSync(dirname(file), { recursive: true })
  const db = new Database(file, { create: true })
  db.exec('CREATE TABLE migration (n INTEGER PRIMARY KEY, at TEXT NOT NULL)')
  db.exec(MIGRATIONS[0]!)
  db.run("INSERT INTO migration (n, at) VALUES (1, 'now')")
  for (const row of rows) db.run(row)
  db.close()
}
const itemIds = () => ledger.all<{ id: string }>('SELECT id FROM item ORDER BY id').map(r => r.id)

describe('Ledger', () => {
  test('open makes the folder of the file and runs the migrations once', () => {
    expect(ledger.get<{ n: number }>('SELECT MAX(n) AS n FROM migration')).toEqual({ n: 2 })
    ledger.close()
    ledger = Ledger.open(join(dir, 'state', 'engineering.db'))
    expect(ledger.all('SELECT n FROM migration')).toEqual([{ n: 1 }, { n: 2 }])
  })

  test('open renames the old state checking to review in the items and the events, and keeps the history', () => {
    const file = join(dir, 'old', 'engineering.db')
    writeFirstSchema(file, [
      "INSERT INTO item (id, title, state, created, updated) VALUES ('SHOP-1', 'x', 'checking', 'now', 'now')",
      "INSERT INTO item (id, title, state, blocked_from, created, updated) VALUES ('SHOP-2', 'x', 'blocked', 'checking', 'now', 'now')",
      "INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-1', 'submit', 'cooking', 'checking', 'lead', 'lead', '1')",
      "INSERT INTO event (item, type, from_state, to_state, actor, role, at) VALUES ('SHOP-1', 'reject', 'checking', 'cooking', 'lead', 'lead', '2')",
    ])
    const old = Ledger.open(file)
    expect(old.all('SELECT id, state, blocked_from FROM item ORDER BY id')).toEqual([
      { id: 'SHOP-1', state: 'review', blocked_from: null },
      { id: 'SHOP-2', state: 'blocked', blocked_from: 'review' },
    ])
    expect(old.all('SELECT type, from_state, to_state FROM event ORDER BY id')).toEqual([
      { type: 'submit', from_state: 'cooking', to_state: 'review' },
      { type: 'reject', from_state: 'review', to_state: 'cooking' },
    ])
    old.close()
  })

  test('write commits the work and returns its result', () => {
    expect(ledger.write(() => (addItem('A-1'), 7))).toBe(7)
    expect(itemIds()).toEqual(['A-1'])
  })

  test('a thrown error rolls the whole write back', () => {
    expect(() => ledger.write(() => {
      addItem('A-1')
      throw new Error('stop')
    })).toThrow('stop')
    expect(itemIds()).toEqual([])
  })

  test('a write inside a write joins it, so an error in the outer one rolls back both', () => {
    expect(() => ledger.write(() => {
      ledger.write(() => addItem('A-1'))
      addItem('A-2')
      throw new Error('stop')
    })).toThrow('stop')
    expect(itemIds()).toEqual([])
  })

  test('get returns null when no row matches', () => {
    expect(ledger.get('SELECT id FROM item WHERE id = ?', 'none')).toBeNull()
  })
})
