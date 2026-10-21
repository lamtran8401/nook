import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { type ChildProcess, spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Pairs } from '@nook/core/web/pairs.ts'
import { readBoard } from '@nook/engineering/read/reader.ts'
import { runCommand } from '@nook/shared/run.ts'

import { buildOnce } from './built.ts'
import { chromePath } from './layout-probe.ts'

const web = join(import.meta.dirname, '..')
const repo = join(web, '..', '..')
const env = { ...process.env, NOOK_TELEMETRY_DISABLED: '1', NEXT_TELEMETRY_DISABLED: '1' }
type Page = { send: (method: string, params?: object) => Promise<any>; close: () => void }

let home: string
let desk: string
let server: ChildProcess
let chrome: ChildProcess
let page: Page

/** The first match of `pattern` in what `child` writes on `stream`. */
function seen(child: ChildProcess, pattern: RegExp, stream: 'stdout' | 'stderr'): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = ''
    child[stream]!.on('data', (chunk: Buffer) => {
      text += chunk
      const match = pattern.exec(text)
      if (match) resolve(match[1] ?? match[0])
    })
    child.once('exit', code => reject(new Error(`exit ${code}: ${text}`)))
  })
}

/** One page of Chrome over its debug protocol: a command and its answer. */
async function connect(address: string): Promise<Page> {
  const socket = new WebSocket(address)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0
  const waiting = new Map<number, (value: unknown) => void>()
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown }
    if (message.id && waiting.has(message.id)) waiting.get(message.id)!(message.result)
  })
  const send = (method: string, params: object = {}) =>
    new Promise<any>(resolve => {
      const n = ++id
      waiting.set(n, resolve)
      socket.send(JSON.stringify({ id: n, method, params }))
    })
  return { send, close: () => socket.close() }
}

const freePort = () =>
  new Promise<number>(resolve => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as { port: number }
      probe.close(() => resolve(port))
    })
  })

const evaluate = async (expression: string) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value

/** Waits until `expression` is true in the page, for 20 seconds at most. */
async function until(expression: string): Promise<void> {
  const end = Date.now() + 20_000
  while (!(await evaluate(expression))) {
    if (Date.now() > end) throw new Error(`timed out on ${expression}`)
    await Bun.sleep(100)
  }
}

/** A key as a person presses it: down, then up. `modifiers` 2 is Control. */
async function press(key: string, code: string, modifiers = 0) {
  const text = modifiers || key.length > 1 ? undefined : key
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, ...(text ? { text } : {}) })
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers })
}

async function open(path: string) {
  await page.send('Page.navigate', { url: `http://127.0.0.1:${port}${path}` })
  await until(`!!document.querySelector('[data-slot=app-shell]') && document.readyState === 'complete'`)
  // the keys wait for the effects of the page: the shell and the menu add their listeners after hydration
  await Bun.sleep(600)
}

let port = 0

beforeAll(async () => {
  expect(buildOnce().code).toBe(0)
  home = mkdtempSync(join(tmpdir(), 'nook-shell-'))
  desk = join(home, 'shop')
  runCommand(['bun', 'run', 'demo', desk], { cwd: repo, env, timeoutMs: 120_000 })
  const token = new Pairs(desk).offer()
  port = await freePort()
  server = spawn('node', ['server.ts'], { cwd: web, env: { ...env, NOOK_DESK: desk, XDG_CONFIG_HOME: home, NOOK_WEB_PORT: String(port) }, stdio: ['pipe', 'pipe', 'pipe'] })
  await seen(server, /Ready in/, 'stdout')
  chrome = spawn(chromePath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${join(home, 'chrome')}`, '--window-size=1440,1000', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] })
  const browser = await seen(chrome, /DevTools listening on (ws:\S+)/, 'stderr')
  const targets = (await (await fetch(browser.replace('ws://', 'http://').replace(/\/devtools.*/, '/json/list'))).json()) as { type: string; webSocketDebuggerUrl: string }[]
  page = await connect(targets.find(t => t.type === 'page')!.webSocketDebuggerUrl)
  // the pair token swaps for the cookie of the owner, as the link of nook web does
  await page.send('Page.navigate', { url: `http://127.0.0.1:${port}/?t=${token}` })
  await until(`location.pathname === '/shop'`)
}, 400_000)

afterAll(() => {
  page?.close()
  chrome?.kill()
  server?.stdin?.end()
  rmSync(home, { recursive: true, force: true })
})

describe('the shell of the web app in a real browser', () => {
  test('[ hides the docked sidebar, and [ again docks it', async () => {
    await open('/shop')
    expect(await evaluate(`document.querySelector('[data-slot=app-shell]').dataset.side`)).toBe('docked')
    await press('[', 'BracketLeft')
    await until(`document.querySelector('[data-slot=app-shell]').dataset.side === 'hidden'`)
    await press('[', 'BracketLeft')
    await until(`document.querySelector('[data-slot=app-shell]').dataset.side === 'docked'`)
  }, 60_000)

  test('⌘K opens the menu with the moves that wait first, and Escape closes it', async () => {
    await open('/shop')
    await press('k', 'KeyK', 2)
    await until(`!!document.querySelector('[data-slot=command-menu]')`)
    expect(await evaluate(`document.querySelector('[data-slot=command-menu] p').textContent`)).toBe('Your moves')
    await press('Escape', 'Escape')
    await until(`!document.querySelector('[data-slot=command-menu]')`)
  }, 60_000)

  test('G then B opens the board', async () => {
    await open('/shop')
    await press('g', 'KeyG')
    await press('b', 'KeyB')
    await until(`location.pathname === '/shop/works'`)
  }, 60_000)

  test('Approve from ⌘K asks first, and Cancel runs nothing', async () => {
    await open('/shop')
    await press('k', 'KeyK', 2)
    await until(`!!document.querySelector('[data-slot=command-menu] input')`)
    await page.send('Input.insertText', { text: 'Approve SHOP-43' })
    await press('Enter', 'Enter')
    await until(`[...document.querySelectorAll('[role=alertdialog] h2')].some(h => h.textContent === 'Approve SHOP-43?')`)
    await evaluate(`[...document.querySelectorAll('[role=alertdialog] button')].find(b => b.textContent === 'Cancel').click()`)
    await until(`!document.querySelector('[role=alertdialog]')`)
    expect(readBoard(desk).find(card => card.id === 'SHOP-43')?.state).toBe('planning')
  }, 60_000)

  test('a page of 390 px floats the sidebar and runs no line off the page', async () => {
    await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await open('/shop/works')
    expect(await evaluate(`document.querySelector('[data-slot=app-shell]').dataset.side`)).toBe('hidden')
    expect(await evaluate(`document.documentElement.scrollWidth <= innerWidth`)).toBe(true)
    await page.send('Emulation.clearDeviceMetricsOverride')
  }, 60_000)
})
