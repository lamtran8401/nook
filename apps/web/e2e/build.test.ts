import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Ledger } from '@nook/engineering/ledger.ts'
import { runCommand } from '@nook/shared/run.ts'

const web = join(import.meta.dirname, '..')
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
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
  const noDesk = Object.fromEntries(Object.entries(env).filter(([name]) => name !== 'NOOK_DESK'))
  build = runCommand(['node', join(web, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], { cwd: web, env: noDesk, timeoutMs: 300_000 })
})
type Answer = { status: number; body: string }
type Answers = Record<'home' | 'page' | 'item' | 'dialog', Answer> & { login: { status: number; location: string; cookie: string }; stranger: { status: number } }
let rendered: Answers | null = null

/** The answers of the real request handler under Node, rendered once for the tests that read them. */
function answer(): Answers {
  if (rendered) return rendered
  const run = runCommand(['node', join(web, 'e2e', 'render.ts'), 'token-e2e'], { cwd: web, env: { ...env, NOOK_DESK: desk }, timeoutMs: 120_000 })
  rendered = JSON.parse(run.out.trim().split('\n').at(-1) ?? '{}') as Answers
  return rendered
}

/** The page of one answer, after a check that it came with 200. */
function body(name: 'home' | 'page' | 'item' | 'dialog'): string {
  expect(answer()[name].status).toBe(200)
  return answer()[name].body.replaceAll('<!-- -->', '')
}

afterAll(() => {
  rmSync(desk, { recursive: true, force: true })
})

describe('the web app', () => {
  test('builds under Node with no desk, so one build serves every desk', () => {
    expect(build.err).not.toContain('Error:')
    expect(build.code).toBe(0)
  })

  test('swaps the one-time token for a cookie and refuses a request with none', () => {
    expect(answer().login).toMatchObject({ status: 303, location: '/' })
    expect(answer().login.cookie).toMatch(/^nook_session_4321=.+/)
    expect(answer().stranger.status).toBe(401)
  })

  test('the home page gives the brief of the desk, each gap of the doctor with its fix', () => {
    const home = body('home')
    expect(home).toContain('<b>engineering: works/ is missing</b><small>nook init --update</small>')
    expect(home).toContain('<b>SHOP-12 backlog: Filter shipments by status</b><small>/spec SHOP-12</small>')
  })

  test('/works gives the board, with a card for each item that links to it', () => {
    const page = body('page')
    expect(page).toContain('<a class="bn-card nk-card" data-item="SHOP-12" href="/works/SHOP-12">')
    expect(page).toContain('<span class="nk-card__title">Filter shipments by status</span>')
    expect(page).toContain('<section class="nk-col" data-state="backlog">')
    expect(page).toContain('<a href="/works" aria-current="page">Works</a>')
  })

  test('the full page of an item opens its tab, with no dialog', () => {
    const item = body('item')
    expect(item).toContain('<h1 class="nk-head__title">Filter shipments by status</h1>')
    expect(item).toContain('aria-selected="true" href="/works/SHOP-12?tab=walkthrough">Walkthrough</a>')
    expect(item).toContain('type /view SHOP-12 in the agent session')
    expect(item).not.toContain('Open in new tab')
  })

  test('a click on a card, as the client router asks for it, gets the item in the dialog over the board', () => {
    expect(body('dialog')).toContain('Open in new tab')
  })

  test('the server refuses to start when no token comes on stdin, and listens on nothing', () => {
    const run = runCommand(['node', join(web, 'server.ts')], { cwd: web, env: { ...env, NOOK_DESK: desk, NOOK_WEB_PORT: '4321' }, timeoutMs: 60_000 })
    expect(run.code).not.toBe(0)
    expect(run.err).toContain('no token came on stdin')
  })
})
