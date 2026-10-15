import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/** The ledger: one SQLite file in the state folder of the home. Every write is one `BEGIN IMMEDIATE` transaction. */

const MIGRATIONS: string[] = [
  `
  CREATE TABLE item (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'feature', size TEXT NOT NULL DEFAULT 'M',
    mode TEXT NOT NULL DEFAULT 'normal', mode_by TEXT, state TEXT NOT NULL, blocked_from TEXT, reason TEXT,
    areas TEXT NOT NULL DEFAULT '[]', source TEXT, rank INTEGER NOT NULL DEFAULT 0, quick INTEGER NOT NULL DEFAULT 0,
    evidence_from INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL, updated TEXT NOT NULL
  );
  CREATE TABLE event (
    id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL REFERENCES item(id), type TEXT NOT NULL,
    from_state TEXT, to_state TEXT, actor TEXT NOT NULL, role TEXT NOT NULL, reason TEXT, at TEXT NOT NULL
  );
  CREATE INDEX event_item ON event(item, id);
  CREATE TABLE approval (
    item TEXT NOT NULL REFERENCES item(id), document TEXT NOT NULL, hash TEXT NOT NULL, at TEXT NOT NULL,
    PRIMARY KEY (item, document)
  );
  CREATE TABLE criterion (
    item TEXT NOT NULL REFERENCES item(id), n INTEGER NOT NULL, text TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0,
    evidence TEXT, grade TEXT, by TEXT, at TEXT, PRIMARY KEY (item, n)
  );
  CREATE TABLE slice (
    item TEXT NOT NULL REFERENCES item(id), id TEXT NOT NULL, title TEXT NOT NULL, area TEXT NOT NULL,
    depends TEXT NOT NULL DEFAULT '[]', acs TEXT NOT NULL DEFAULT '[]', size TEXT, state TEXT NOT NULL DEFAULT 'todo',
    assignee TEXT, reason TEXT, files TEXT NOT NULL DEFAULT '[]', proof TEXT NOT NULL DEFAULT 'none', proof_note TEXT,
    version INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (item, id)
  );
  CREATE TABLE question (
    id TEXT NOT NULL, item TEXT NOT NULL REFERENCES item(id), text TEXT NOT NULL, blocking INTEGER NOT NULL DEFAULT 0,
    recommended TEXT, answer TEXT, status TEXT NOT NULL DEFAULT 'open', asked_by TEXT NOT NULL, answered_by TEXT,
    asked_at TEXT NOT NULL, answered_at TEXT, PRIMARY KEY (item, id)
  );
  CREATE TABLE guess (
    id TEXT NOT NULL, item TEXT NOT NULL REFERENCES item(id), question TEXT NOT NULL, took TEXT NOT NULL, other TEXT NOT NULL,
    impact TEXT NOT NULL, slices TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'open', answer TEXT,
    by TEXT NOT NULL, at TEXT NOT NULL, PRIMARY KEY (item, id)
  );
  CREATE TABLE check_run (
    id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL REFERENCES item(id), area TEXT NOT NULL, "check" TEXT NOT NULL,
    result TEXT NOT NULL, output TEXT NOT NULL DEFAULT '', at TEXT NOT NULL
  );
  CREATE TABLE session (
    id TEXT PRIMARY KEY, item TEXT NOT NULL REFERENCES item(id), role TEXT NOT NULL, holds INTEGER NOT NULL DEFAULT 0,
    seen_at TEXT NOT NULL
  );
  CREATE TABLE note (
    id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL REFERENCES item(id), text TEXT NOT NULL, by TEXT NOT NULL, at TEXT NOT NULL
  );
  `,
]

export function openDb(file: string): Database {
  mkdirSync(dirname(file), { recursive: true })
  const db = new Database(file, { create: true })
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA busy_timeout = 5000')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db: Database): void {
  db.exec('CREATE TABLE IF NOT EXISTS migration (n INTEGER PRIMARY KEY, at TEXT NOT NULL)')
  const done = (db.query('SELECT MAX(n) AS n FROM migration').get() as { n: number | null }).n ?? 0
  for (let n = done + 1; n <= MIGRATIONS.length; n++) {
    write(db, () => {
      db.exec(MIGRATIONS[n - 1]!)
      db.run('INSERT INTO migration (n, at) VALUES (?, ?)', [n, now()])
    })
  }
}

/** One write transaction that takes the lock at its start. A thrown error rolls it back. */
export function write<T>(db: Database, work: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = work()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export const now = () => new Date().toISOString()

export const parseList = (json: string | null | undefined): string[] => (json ? (JSON.parse(json) as string[]) : [])
export const parseNumbers = (json: string | null | undefined): number[] => (json ? (JSON.parse(json) as number[]) : [])
