import { existsSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

export type Param = SQLInputValue

/**
 * A file with no -wal beside it holds every write itself, so it opens as immutable: with no -shm, which a read-only
 * open under Bun cannot create.
 */
function immutable(file: string): URL {
  const url = pathToFileURL(file)
  url.searchParams.set('immutable', '1')
  return url
}

/**
 * One SQLite file through `node:sqlite`, which Bun and Node both provide, so the CLI and the web app share it.
 * A read-only open never creates the file and refuses every write.
 */
export class SqlFile {
  readonly #db: DatabaseSync
  readonly #statements = new Map<string, StatementSync>()

  private constructor(db: DatabaseSync) {
    this.#db = db
  }

  static open(file: string, options: { readOnly?: boolean } = {}): SqlFile {
    if (!options.readOnly) return new SqlFile(new DatabaseSync(file))
    const db = new DatabaseSync(existsSync(`${file}-wal`) ? file : immutable(file), { readOnly: true })
    db.exec('PRAGMA query_only = ON')
    return new SqlFile(db)
  }

  get inTransaction(): boolean {
    return this.#db.isTransaction
  }

  exec(sql: string): void {
    this.#db.exec(sql)
  }

  run(sql: string, ...params: Param[]): void {
    this.#statement(sql).run(...params)
  }

  get<T>(sql: string, ...params: Param[]): T | null {
    return (this.#statement(sql).get(...params) as T | undefined) ?? null
  }

  all<T>(sql: string, ...params: Param[]): T[] {
    return this.#statement(sql).all(...params) as T[]
  }

  close(): void {
    this.#db.close()
  }

  #statement(sql: string): StatementSync {
    let statement = this.#statements.get(sql)
    if (!statement) {
      statement = this.#db.prepare(sql)
      this.#statements.set(sql, statement)
    }
    return statement
  }
}
