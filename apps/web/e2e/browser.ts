/** A real browser on the built web app, for the tests that need clicks, keys and layout. */
import { type ChildProcess, spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

import { Pairs } from '@nook/core/web/pairs.ts'
import { runCommand } from '@nook/shared/run.ts'

import { buildOnce } from './built.ts'
import { chromePath } from './layout-probe.ts'

const web = join(import.meta.dirname, '..')
const repo = join(web, '..', '..')
const env = { ...process.env, NOOK_TELEMETRY_DISABLED: '1', NEXT_TELEMETRY_DISABLED: '1' }
type Page = { send: (method: string, params?: object) => Promise<any>; close: () => void }

let home: string
export let desk: string
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

export const evaluate = async (expression: string) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value

/** Waits until `expression` is true in the page, for 20 seconds at most. */
export async function until(expression: string): Promise<void> {
  const end = Date.now() + 20_000
  while (!(await evaluate(expression))) {
    if (Date.now() > end) throw new Error(`timed out on ${expression}`)
    await sleep(100)
  }
}

/** A key as a person presses it: down, then up. `modifiers` 2 is Control. */
export async function press(key: string, code: string, modifiers = 0) {
  const text = modifiers || key.length > 1 ? undefined : key
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, ...(text ? { text } : {}) })
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers })
}

/** Types `text` into the field that has the focus. */
export const typeText = (text: string) => page.send('Input.insertText', { text })

export async function open(path: string) {
  await page.send('Page.navigate', { url: `http://127.0.0.1:${port}${path}` })
  await until(`!!document.querySelector('[data-slot=app-shell]') && document.readyState === 'complete'`)
  // the keys wait for the effects of the page: the shell and the menu add their listeners after hydration
  await sleep(600)
}

let port = 0

/** Builds the app once, makes the demo desk `shop`, starts the server and Chrome at 1440 px, and pairs as the owner. */
export async function startBrowser(): Promise<void> {
  const built = buildOnce()
  if (built.code !== 0) throw new Error(`the build failed: ${built.err || built.out}`)
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
}

export function stopBrowser(): void {
  page?.close()
  chrome?.kill()
  server?.stdin?.end()
  rmSync(home, { recursive: true, force: true })
}

/** Sets the size of the page, or clears it back to the 1440 px window with no size. */
export const resize = (size?: { width: number; height: number }) =>
  size ? page.send('Emulation.setDeviceMetricsOverride', { ...size, deviceScaleFactor: 1, mobile: size.width < 600 }) : page.send('Emulation.clearDeviceMetricsOverride')

