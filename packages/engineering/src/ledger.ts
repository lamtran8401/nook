import { Database, type SQLQueryBindings } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { MIGRATIONS } from './migrations.ts'

export type Param = SQLQueryBindings

/** The SQLite file of the home. Every write runs in one transaction that takes the lock at its start. */
export class Ledger {
  private constructor(private readonly db: Database) {}

  static open(file: string): Ledger {
    mkdirSync(dirname(file), { recursive: true })
    const db = new Database(file, { create: true })
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA busy_timeout = 5000')
    db.exec('PRAGMA foreign_keys = ON')
    const ledger = new Ledger(db)
    ledger.migrate()
    return ledger
  }

  /** `BEGIN IMMEDIATE`, then `work`; an error rolls it back. Inside an open transaction `work` joins it. */
  write<T>(work: () => T): T {
    if (this.db.inTransaction) return work()
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const result = work()
      this.db.exec('COMMIT')
      return result
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }

  run(sql: string, ...params: Param[]): void {
    this.db.run(sql, params)
  }

  get<T>(sql: string, ...params: Param[]): T | null {
    return (this.db.query(sql).get(...params) as T | null) ?? null
  }

  all<T>(sql: string, ...params: Param[]): T[] {
    return this.db.query(sql).all(...params) as T[]
  }

  close(): void {
    this.db.close()
  }

  private migrate(): void {
    this.db.exec('CREATE TABLE IF NOT EXISTS migration (n INTEGER PRIMARY KEY, at TEXT NOT NULL)')
    const done = this.get<{ n: number | null }>('SELECT MAX(n) AS n FROM migration')?.n ?? 0
    for (let n = done + 1; n <= MIGRATIONS.length; n++) {
      this.write(() => {
        this.db.exec(MIGRATIONS[n - 1]!)
        this.run('INSERT INTO migration (n, at) VALUES (?, ?)', n, now())
      })
    }
  }
}

export const now = () => new Date().toISOString()

export const parseList = (json: string | null | undefined): string[] =>
  json ? (JSON.parse(json) as string[]) : []
export const parseNumbers = (json: string | null | undefined): number[] =>
  json ? (JSON.parse(json) as number[]) : []
