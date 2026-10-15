import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Ledger } from '../src/ledger.ts'

let dir: string
let ledger: Ledger
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'kit-ledger-'))
  ledger = Ledger.open(join(dir, 'state', 'engineering.db'))
})
afterEach(() => {
  ledger.close()
  rmSync(dir, { recursive: true, force: true })
})

const addItem = (id: string) =>
  ledger.run("INSERT INTO item (id, title, state, created, updated) VALUES (?, 'x', 'backlog', 'now', 'now')", id)
const itemIds = () => ledger.all<{ id: string }>('SELECT id FROM item ORDER BY id').map(r => r.id)

describe('Ledger', () => {
  test('open makes the folder of the file and runs the migrations once', () => {
    expect(ledger.get<{ n: number }>('SELECT MAX(n) AS n FROM migration')).toEqual({ n: 1 })
    ledger.close()
    ledger = Ledger.open(join(dir, 'state', 'engineering.db'))
    expect(ledger.all('SELECT n FROM migration')).toEqual([{ n: 1 }])
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
