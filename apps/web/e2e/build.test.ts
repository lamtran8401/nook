import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Ledger } from '@nook/engineering/ledger.ts'
import { runCommand } from '@nook/shared/run.ts'

import { buildOnce } from './built.ts'

const web = join(import.meta.dirname, '..')
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
// the desk list of the run lives in its desk, never in the home of the owner
const withDesk = (dir: string) => ({ ...env, NOOK_DESK: dir, XDG_CONFIG_HOME: dir })
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
  build = buildOnce()
})
type Answer = { status: number; body: string }
type Answers = Record<'home' | 'page' | 'item' | 'dialog' | 'again' | 'stranger' | 'strangerWrite' | 'ghost', Answer> & { login: Answer & { cookie: string }; base: string; root: { status: number; location: string } }
let rendered: Answers | null = null

/** The answers of the real request handler under Node, rendered once for the tests that read them. */
function answer(): Answers {
  if (rendered) return rendered
  const run = runCommand(['node', join(web, 'e2e', 'render.ts')], { cwd: web, env: withDesk(desk), timeoutMs: 120_000 })
  rendered = JSON.parse(run.out.trim().split('\n').at(-1) ?? '{}') as Answers
  return rendered
}

/** The page of one answer, after a check that it came with 200. */
function body(name: 'home' | 'page' | 'item' | 'dialog' | 'stranger'): string {
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

  test('its server prints the banner of Next.js, its ready line, and one line for each request with no query string', async () => {
    const port = await freePort()
    const server = spawn('node', ['server.ts'], { cwd: web, env: { ...withDesk(desk), NOOK_WEB_PORT: String(port) }, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    server.stdout.on('data', (chunk: Buffer) => (out += chunk))
    try {
      await until(() => out.includes('Ready in'))
      await fetch(`http://127.0.0.1:${port}/works?t=secret-token`, { redirect: 'manual' })
      await until(() => out.includes(' /works '))
      // Next.js prints its own lines first, such as the time to run next.config.ts
      expect(out).toMatch(/\n {3}▲ Next\.js 16\.\d+\.\d+\n {3}- Local: {3}http:\/\/127\.0\.0\.1:\d+\n {3}- Desks: {3}nook-web-\w+\n\n ✓ Ready in \d+ms\n/)
      expect(out).toMatch(/\n GET \/works \d{3} in \d+ms\n/)
      expect(out).not.toContain('secret-token')
    } finally {
      server.kill()
    }
  }, 60_000)

  test('swaps the pair token of the desk for a cookie, once', () => {
    expect(answer().login).toMatchObject({ status: 200, body: expect.stringContaining('<script>location.replace("/")</script>') })
    expect(answer().login.cookie).toMatch(/^nook_session_4321=.+/)
    expect(answer().again).toEqual({ status: 401, body: 'this link was used, is old or is wrong: run `nook web pair` for a new one' })
  })

  test('a browser with no pair reads the page with the owner buttons off, and its move is refused', () => {
    const page = body('stranger')
    expect(page).toContain('>View only.</b>')
    expect(/<fieldset[^>]*>/.exec(page)![0]).toContain(' disabled=""')
    expect(answer().strangerWrite).toEqual({ status: 401, body: 'pair this browser first: run `nook web pair` in your terminal' })
  })

  test('the paired browser gets the owner buttons on, with no view-only note', () => {
    const item = body('item')
    expect(item).not.toContain('View only.')
    expect(/<fieldset[^>]*>/.exec(item)![0]).not.toContain(' disabled=""')
  })

  test('the home page gives the brief of the desk: each gap of the doctor with its fix, and each item that runs', () => {
    const home = body('home')
    expect(home).toMatch(/>This desk<\/div>/)
    expect(home).toMatch(/<p class="text-sm">engineering: works\/ is missing<\/p><code data-slot="copy-command"[^>]*>nook init --update<button/)
    expect(home).toContain(`<a href="${answer().base}/works/SHOP-12" class="flex min-w-0 flex-1`)
    expect(home).toMatch(/<code data-slot="copy-command"[^>]*>\/spec SHOP-12<button/)
  })

  test('/works gives the board, with a card for each item that links to it', () => {
    const page = body('page')
    expect(page).toContain('&quot;type&quot;:&quot;board&quot;')
    expect(page).toContain(`&quot;title&quot;:&quot;Filter shipments by status&quot;,&quot;href&quot;:&quot;${answer().base}/works/SHOP-12&quot;`)
    expect(page).toContain('{&quot;title&quot;:&quot;backlog&quot;,&quot;tone&quot;:&quot;neutral&quot;,&quot;cards&quot;:')
    expect(new RegExp(`<a [^>]*href="${answer().base}/works"[^>]*>`).exec(page)![0]).toContain('aria-current="page"')
  })

  test('the full page of an item opens its tab, with no dialog', () => {
    const item = body('item')
    expect(item).toMatch(/<h1 [^>]*>Filter shipments by status<\/h1>/)
    expect(new RegExp(`<a [^>]*href="${answer().base}/works/SHOP-12\\?tab=walkthrough"[^>]*>Walkthrough</a>`).exec(item)![0]).toContain('aria-current="page"')
    expect(item).toMatch(/type <code data-slot="copy-command"[^>]*>\/view SHOP-12<button/)
    expect(item).not.toContain('Open in new tab')
  })

  test('the address of the app goes to the desk where nook web started; a path of no desk is a 404', () => {
    expect(answer().root).toMatchObject({ status: 307, location: answer().base })
    expect(answer().ghost.status).toBe(404)
  })

  test('a click on a card, as the client router asks for it, gets the item in the dialog over the board', () => {
    expect(body('dialog')).toContain('Open in new tab')
  })

  test('the server refuses to start with no desk, and listens on nothing', () => {
    const noDesk = Object.fromEntries(Object.entries(env).filter(([name]) => name !== 'NOOK_DESK'))
    const run = runCommand(['node', join(web, 'server.ts')], { cwd: web, env: { ...noDesk, NOOK_WEB_PORT: '4321' }, timeoutMs: 60_000 })
    expect(run.code).not.toBe(0)
    expect(run.err).toContain('start the web app with `nook web`')
    expect(run.out).not.toContain('listening')
  })

  test('the server stops when its stdin ends, as when nook web goes', () => {
    const run = runCommand(['node', join(web, 'server.ts')], { cwd: web, env: { ...env, NOOK_DESK: desk, NOOK_WEB_PORT: '4321' }, timeoutMs: 60_000 })
    expect(run.code).toBe(0)
  })
})

/** A port that no program holds now. */
function freePort(): Promise<number> {
  return new Promise(resolve => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as { port: number }
      probe.close(() => resolve(port))
    })
  })
}

/** Waits until `ready` holds, for 30 seconds at most. */
async function until(ready: () => boolean): Promise<void> {
  const end = Date.now() + 30_000
  while (!ready()) {
    if (Date.now() > end) throw new Error('timed out')
    await Bun.sleep(100)
  }
}
