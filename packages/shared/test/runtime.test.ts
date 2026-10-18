import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { runCommand } from '../src/run.ts'

const root = resolve(import.meta.dirname, '..', '..', '..')
const BUN_API = /\bBun\.|from ['"]bun:|import\.meta\.(?:dir|file|path|main)\b/

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    return entry.name.endsWith('.ts') ? [path] : []
  })
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'nook-runtime-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('the packages run under Bun and Node', () => {
  test('no source file of a package uses a Bun API', () => {
    const packages = readdirSync(join(root, 'packages'))
    const users = packages
      .flatMap(name => sources(join(root, 'packages', name, 'src')))
      .filter(file => BUN_API.test(readFileSync(file, 'utf8')))
      .map(file => relative(root, file))
    expect(users).toEqual([])
  })

  test('the SQLite file and the command runner work under Node', () => {
    const url = (name: string) => pathToFileURL(join(root, 'packages', 'shared', 'src', name)).href
    const script = join(dir, 'check.mjs')
    writeFileSync(script, `
      const { SqlFile } = await import(${JSON.stringify(url('sql.ts'))})
      const { runCommand } = await import(${JSON.stringify(url('run.ts'))})
      const db = SqlFile.open(${JSON.stringify(join(dir, 'a.db'))})
      db.exec('CREATE TABLE t (n INTEGER)')
      db.run('INSERT INTO t (n) VALUES (?)', 7)
      const row = db.get('SELECT n FROM t')
      db.close()
      const reader = SqlFile.open(${JSON.stringify(join(dir, 'a.db'))}, { readOnly: true })
      let write = 'allowed'
      try { reader.run('INSERT INTO t (n) VALUES (8)') } catch (error) { write = error.message }
      reader.close()
      console.log(JSON.stringify({ row, write, echo: runCommand(['echo', 'hi']).out, bun: typeof Bun }))
    `)
    const run = runCommand(['node', script])
    expect(run.err).not.toContain('Error')
    expect(JSON.parse(run.out)).toEqual({ row: { n: 7 }, write: 'attempt to write a readonly database', echo: 'hi\n', bun: 'undefined' })
  })
})
