import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { SqlFile } from '../src/sql.ts'

let dir: string
let db: SqlFile
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-sql-'))
  db = SqlFile.open(join(dir, 'a.db'))
  db.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT NOT NULL, tags TEXT)')
})
afterEach(() => {
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

describe('SqlFile', () => {
  test('run writes rows with bound values, and all reads them back in order', () => {
    db.run('INSERT INTO note (text, tags) VALUES (?, ?)', 'first', null)
    db.run('INSERT INTO note (text, tags) VALUES (?, ?)', 'second', '["a"]')
    expect(db.all('SELECT id, text, tags FROM note ORDER BY id')).toEqual([
      { id: 1, text: 'first', tags: null },
      { id: 2, text: 'second', tags: '["a"]' },
    ])
  })

  test('get returns the first matching row', () => {
    db.run("INSERT INTO note (text) VALUES ('first'), ('second')")
    expect(db.get<{ text: string }>('SELECT text FROM note WHERE id = ?', 2)).toEqual({ text: 'second' })
  })

  test('get returns null when no row matches', () => {
    expect(db.get('SELECT text FROM note WHERE id = ?', 9)).toBeNull()
  })

  test('inTransaction is true only between BEGIN and COMMIT', () => {
    expect(db.inTransaction).toBe(false)
    db.exec('BEGIN IMMEDIATE')
    expect(db.inTransaction).toBe(true)
    db.exec('COMMIT')
    expect(db.inTransaction).toBe(false)
  })

  test('a read-only open reads the rows of the file', () => {
    db.run("INSERT INTO note (text) VALUES ('kept')")
    const reader = SqlFile.open(join(dir, 'a.db'), { readOnly: true })
    expect(reader.all('SELECT text FROM note')).toEqual([{ text: 'kept' }])
    reader.close()
  })

  test('a read-only open refuses a write', () => {
    const reader = SqlFile.open(join(dir, 'a.db'), { readOnly: true })
    expect(() => reader.run("INSERT INTO note (text) VALUES ('no')")).toThrow('readonly')
    reader.close()
    expect(db.all('SELECT text FROM note')).toEqual([])
  })

  test('a read-only open of a missing file throws and creates no file', () => {
    const file = join(dir, 'missing.db')
    expect(() => SqlFile.open(file, { readOnly: true })).toThrow('unable to open')
    expect(existsSync(file)).toBe(false)
  })
})
