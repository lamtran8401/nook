import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { refused } from '@nook/shared/errors.ts'
import { type Param, SqlFile } from '@nook/shared/sql.ts'

import { MIGRATIONS } from './migrations.ts'

export type { Param }

const MIGRATE_FIX = 'run any `nook eng` command in the desk'

/** The SQLite file of the home. Every write runs in one transaction that takes the lock at its start. */
export class Ledger {
  private constructor(private readonly db: SqlFile) {}

  static open(file: string): Ledger {
    mkdirSync(dirname(file), { recursive: true })
    const db = SqlFile.open(file)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA busy_timeout = 5000')
    db.exec('PRAGMA foreign_keys = ON')
    const ledger = new Ledger(db)
    ledger.migrate()
    return ledger
  }

  /** The ledger of a read path: it makes no folder, runs no migration and refuses a write. A missing or old ledger is a gap. */
  static openReadOnly(file: string): Ledger {
    if (!existsSync(file)) throw refused(`no ledger at ${file}`, MIGRATE_FIX)
    const db = SqlFile.open(file, { readOnly: true })
    db.exec('PRAGMA busy_timeout = 5000')
    const missing = MIGRATIONS.length - doneMigrations(db)
    if (missing > 0) {
      db.close()
      throw refused(`the ledger needs ${missing} migration${missing === 1 ? '' : 's'}`, MIGRATE_FIX)
    }
    return new Ledger(db)
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
    this.db.run(sql, ...params)
  }

  get<T>(sql: string, ...params: Param[]): T | null {
    return this.db.get<T>(sql, ...params)
  }

  all<T>(sql: string, ...params: Param[]): T[] {
    return this.db.all<T>(sql, ...params)
  }

  close(): void {
    this.db.close()
  }

  private migrate(): void {
    this.db.exec('CREATE TABLE IF NOT EXISTS migration (n INTEGER PRIMARY KEY, at TEXT NOT NULL)')
    for (let n = doneMigrations(this.db) + 1; n <= MIGRATIONS.length; n++) {
      this.write(() => {
        this.db.exec(MIGRATIONS[n - 1]!)
        this.run('INSERT INTO migration (n, at) VALUES (?, ?)', n, now())
      })
    }
  }
}

/** The count of migrations that a ledger ran; a file with no migration table ran none. */
function doneMigrations(db: SqlFile): number {
  const table = db.get('SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?', 'table', 'migration')
  return table ? (db.get<{ n: number | null }>('SELECT MAX(n) AS n FROM migration')?.n ?? 0) : 0
}

export const now = () => new Date().toISOString()

export const parseList = (json: string | null | undefined): string[] =>
  json ? (JSON.parse(json) as string[]) : []
export const parseNumbers = (json: string | null | undefined): number[] =>
  json ? (JSON.parse(json) as number[]) : []
