import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { EvError, refused } from '@nook/shared/errors.ts'
import { type CommandRun, errorLines, runCommand } from '@nook/shared/run.ts'

import { ancestorCommands, underClaude } from '../hooks/session.ts'
import { nodeGap, type WebGap } from './node-version.ts'
import { Pairs } from './pairs.ts'
import { freePort } from './port.ts'
import { needsBuild, sourceHash, writeStamp } from './source-hash.ts'
import { readWebState, type WebState, writeWebState } from './web-state.ts'

/**
 * `nook web`: the workspace in the browser. It refuses inside Claude Code, so only the owner holds a pair token. It builds
 * the web app when its sources changed, starts the server under Node on 127.0.0.1 at the port of the workspace, and pairs
 * the default browser. `nook web pair` pairs one more browser, and `nook web forget` removes each pair.
 */

export type ServerChild = { pid: number; listening: Promise<void>; exited: Promise<number> }
export type WebDeps = {
  insideClaude: () => boolean
  alive: (pid: number) => boolean
  nodeGap: () => WebGap | null
  sources: () => { hash: string; built: boolean }
  build: () => CommandRun
  writeStamp: (hash: string) => void
  freePort: (preferred?: number) => Promise<number>
  offerPair: () => string
  forgetPairs: () => number
  spawnServer: (options: { port: number; workspace: string }) => ServerChild
  open: (url: string) => void
  readState: () => WebState | null
  writeState: (state: WebState) => void
  say: (line: string) => void
  now: () => Date
}

/** Starts the web app of `workspace` and waits until its server stops; returns the exit code of the server. */
export async function startWeb(workspace: string, rebuild: boolean, deps: WebDeps): Promise<number> {
  if (deps.insideClaude()) throw refused('nook web starts only in your own terminal, not in Claude Code', 'open a terminal in the workspace and run `nook web`')
  const last = deps.readState()
  if (last?.pid && deps.alive(last.pid)) throw refused(`nook web already runs for this workspace on port ${last.port}`, 'use its tab, or stop it with Ctrl-C in its terminal')
  const gap = deps.nodeGap()
  if (gap) throw refused(gap.text, gap.fix)
  const sources = deps.sources()
  if (rebuild || !sources.built) {
    deps.say('nook web: building the web app, about a minute')
    const build = deps.build()
    if (build.code !== 0) throw refused(`the build of the web app failed:\n${errorLines(`${build.out}\n${build.err}`)}`, 'fix the error, then run `nook web` again')
    deps.writeStamp(sources.hash)
  }
  const port = await deps.freePort(last?.port)
  if (last && last.port !== port) deps.say(`nook web: another program holds port ${last.port}, so the address is now http://127.0.0.1:${port}`)
  const server = deps.spawnServer({ port, workspace })
  deps.writeState({ port, pid: server.pid, started: deps.now().toISOString() })
  try {
    await server.listening
    deps.open(`http://127.0.0.1:${port}/?t=${deps.offerPair()}`)
    return await server.exited
  } finally {
    deps.writeState({ port })
  }
}

/** `nook web pair`: a new pair link for one more browser, on the server that runs for the workspace. */
export function pairWeb(deps: WebDeps): number {
  if (deps.insideClaude()) throw refused('nook web pair runs only in your own terminal, not in Claude Code', 'open a terminal in the workspace and run `nook web pair`')
  const state = deps.readState()
  if (!state?.pid || !deps.alive(state.pid)) throw refused('nook web does not run for this workspace', 'run `nook web` first, then `nook web pair` in another terminal')
  const token = deps.offerPair()
  deps.say(`Open this link in the browser to pair, within 2 minutes; it works once:\nhttp://127.0.0.1:${state.port}/?t=${token}`)
  return 0
}

/** `nook web forget`: each paired browser loses its session at its next request. */
export function forgetWeb(deps: WebDeps): number {
  if (deps.insideClaude()) throw refused('nook web forget runs only in your own terminal, not in Claude Code', 'open a terminal in the workspace and run `nook web forget`')
  deps.say(`nook web: removed ${deps.forgetPairs()} paired browsers; nook web pairs your browser again`)
  return 0
}

const OPENER: Record<string, string> = { darwin: 'open', win32: 'explorer' }
// the browser reads the page at once; the page holds the token, so it goes soon after
const PAGE_LIFE_MS = 30 * 1000

/** A page in a new private folder that sends the browser to `url`; only the owner can read it, and it sends no referrer. */
export function writeOpenPage(url: string): { dir: string; page: string } {
  const dir = mkdtempSync(join(tmpdir(), 'nook-web-'))
  const page = join(dir, 'open.html')
  writeFileSync(page, `<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><script>location.replace(${JSON.stringify(url)})</script>`, { mode: 0o600 })
  return { dir, page }
}

/** Opens `url` through that page, so the token never shows in the arguments of a process. */
function openPrivately(url: string): void {
  const { dir, page } = writeOpenPage(url)
  const opened = runCommand([OPENER[process.platform] ?? 'xdg-open', page])
  setTimeout(() => rmSync(dir, { recursive: true, force: true }), PAGE_LIFE_MS).unref()
  if (opened.code !== 0) console.log('nook web: the browser did not open; set a default browser, then run nook web again')
}

/** A signal 0 tests a process: ESRCH means it is gone, EPERM that it lives under another user. */
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** The real parts: the Nook repo at `root` holds the web app in apps/web. */
export function webDeps(root: string, workspace: string): WebDeps {
  const web = join(root, 'apps', 'web')
  return {
    insideClaude: () => Boolean(process.env.CLAUDECODE) || underClaude(ancestorCommands()),
    alive: isAlive,
    nodeGap: () => nodeGap(),
    sources: () => ({ hash: sourceHash(root), built: !needsBuild(root) }),
    build: () => runCommand(['node', join(web, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], { cwd: web, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } }),
    writeStamp: hash => writeStamp(root, hash),
    freePort,
    offerPair: () => new Pairs(workspace).offer(),
    forgetPairs: () => new Pairs(workspace).forget(),
    spawnServer: options => spawnServer(web, options),
    open: openPrivately,
    readState: () => readWebState(workspace),
    writeState: state => writeWebState(workspace, state),
    say: line => console.log(line),
    now: () => new Date(),
  }
}

/**
 * The environment of the web server: its workspace, its port, and `NOOK_CLI`, the command of this same nook (the bun and
 * the main file that run it), so an owner move on a page runs the nook that started the page.
 */
export function serverEnv(workspace: string, port: number, base: NodeJS.ProcessEnv = process.env, self = [process.execPath, process.argv[1] ?? '']): NodeJS.ProcessEnv {
  return { ...base, NOOK_WORKSPACE: workspace, NOOK_WEB_PORT: String(port), NOOK_CLI: JSON.stringify(self) }
}

function spawnServer(web: string, { port, workspace }: { port: number; workspace: string }): ServerChild {
  // stdin stays open while nook web runs: when it closes, as when the terminal goes, the server stops too
  const child = spawn('node', ['server.ts'], { cwd: web, env: serverEnv(workspace, port), stdio: ['pipe', 'pipe', 'inherit'] })
  const exited = new Promise<number>(resolve => child.once('exit', code => resolve(code ?? 1)))
  const listening = new Promise<void>((resolve, reject) => {
    child.stdout.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk)
      // the server prints the banner of Next.js, then its ready line
      if (String(chunk).includes('Ready in')) resolve()
    })
    void exited.then(code => reject(new EvError(`the web server stopped before it listened (exit ${code})`)))
  })
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.once(signal, () => child.kill(signal))
  return { pid: child.pid ?? 0, listening, exited }
}
