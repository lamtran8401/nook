import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Ledger } from '@nook/engineering/ledger.ts'
import { runCommand } from '@nook/shared/run.ts'

const web = join(import.meta.dirname, '..')
let desk: string
let build: ReturnType<typeof runCommand>

/** A desk with the engineering pack and two items in its ledger. */
function makeDesk(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nook-web-'))
  writeFileSync(join(dir, 'nook.yml'), 'packs: [engineering]\n')
  const ledger = Ledger.open(join(dir, '.nook', 'engineering.db'))
  for (const [id, title] of [['SHOP-12', 'Filter shipments by status'], ['SHOP-13', 'Export the list']])
    ledger.run("INSERT INTO item (id, title, state, created, updated) VALUES (?, ?, 'backlog', 'now', 'now')", id!, title!)
  ledger.close()
  return dir
}

beforeAll(() => {
  desk = makeDesk()
  build = runCommand(['node', join(web, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], {
    cwd: web,
    env: { ...process.env, NOOK_DESK: desk, NEXT_TELEMETRY_DISABLED: '1' },
    timeoutMs: 300_000,
  })
})
afterAll(() => {
  rmSync(desk, { recursive: true, force: true })
})

describe('the web app', () => {
  test('builds under Node', () => {
    expect(build.err).not.toContain('Error:')
    expect(build.code).toBe(0)
  })

  test('renders the items of the desk from its ledger, under Node', () => {
    const html = readFileSync(join(web, '.next', 'server', 'app', 'index.html'), 'utf8').replaceAll('<!-- -->', '')
    expect(html).toContain('<li data-item="SHOP-12">SHOP-12 · backlog · Filter shipments by status</li>')
    expect(html).toContain('<li data-item="SHOP-13">SHOP-13 · backlog · Export the list</li>')
    expect(html).toMatch(/<p data-runtime="true">node v\d+/)
  })
})
