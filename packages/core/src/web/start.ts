import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'

import { EvError, refused } from '@nook/shared/errors.ts'
import { type CommandRun, errorLines, runCommand } from '@nook/shared/run.ts'

import { nodeGap, type WebGap } from './node-version.ts'
import { freePort } from './port.ts'
import { needsBuild, writeStamp } from './source-hash.ts'
import { readWebState, removeWebState, type WebState, writeWebState } from './web-state.ts'

/**
 * `nook web`: the desk in the browser. It refuses inside Claude Code, so only the owner holds the token. It builds the
 * web app when its sources changed, starts the server under Node on 127.0.0.1, and gives it the token on stdin.
 */

export type ServerChild = { pid: number; listening: Promise<void>; exited: Promise<number> }
export type WebDeps = {
  env: NodeJS.ProcessEnv
  nodeGap: () => WebGap | null
  needsBuild: () => boolean
  build: () => CommandRun
  writeStamp: () => void
  freePort: (preferred?: number) => Promise<number>
  newToken: () => string
  spawnServer: (options: { port: number; token: string; desk: string }) => ServerChild
  open: (url: string) => void
  readState: () => WebState | null
  writeState: (state: WebState) => void
  removeState: () => void
  say: (line: string) => void
  now: () => Date
}

/** Starts the web app of `desk` and waits until its server stops; returns the exit code of the server. */
export async function startWeb(desk: string, rebuild: boolean, deps: WebDeps): Promise<number> {
  if (deps.env.CLAUDECODE) throw refused('nook web starts only in your own terminal, not in Claude Code', 'open a terminal in the desk and run `nook web`')
  const gap = deps.nodeGap()
  if (gap) throw refused(gap.text, gap.fix)
  if (rebuild || deps.needsBuild()) {
    deps.say('nook web: building the web app, about a minute')
    const build = deps.build()
    if (build.code !== 0) throw refused(`the build of the web app failed:\n${errorLines(`${build.out}\n${build.err}`)}`, 'fix the error, then run `nook web` again')
    deps.writeStamp()
  }
  const port = await deps.freePort(deps.readState()?.port)
  const token = deps.newToken()
  const server = deps.spawnServer({ port, token, desk })
  deps.writeState({ port, pid: server.pid, started: deps.now().toISOString() })
  try {
    await server.listening
    deps.say(`nook web: http://127.0.0.1:${port} for ${desk}; Ctrl-C stops it`)
    deps.open(`http://127.0.0.1:${port}/?t=${token}`)
    return await server.exited
  } finally {
    deps.removeState()
  }
}

const OPENER: Record<string, string> = { darwin: 'open', win32: 'explorer' }

/** The real parts: the Nook repo at `root` holds the web app in apps/web. */
export function webDeps(root: string, desk: string): WebDeps {
  const web = join(root, 'apps', 'web')
  return {
    env: process.env,
    nodeGap: () => nodeGap(),
    needsBuild: () => needsBuild(root),
    build: () => runCommand(['node', join(web, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], { cwd: web, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } }),
    writeStamp: () => writeStamp(root),
    freePort,
    newToken: () => randomBytes(32).toString('base64url'),
    spawnServer: options => spawnServer(web, options),
    open: url => {
      const opened = runCommand([OPENER[process.platform] ?? 'xdg-open', url])
      if (opened.code !== 0) console.log('nook web: the browser did not open; set a default browser, then run nook web again')
    },
    readState: () => readWebState(desk),
    writeState: state => writeWebState(desk, state),
    removeState: () => removeWebState(desk),
    say: line => console.log(line),
    now: () => new Date(),
  }
}

function spawnServer(web: string, { port, token, desk }: { port: number; token: string; desk: string }): ServerChild {
  const child = spawn('node', ['server.ts'], { cwd: web, env: { ...process.env, NOOK_DESK: desk, NOOK_WEB_PORT: String(port) }, stdio: ['pipe', 'pipe', 'inherit'] })
  child.stdin.end(`${token}\n`)
  const exited = new Promise<number>(resolve => child.once('exit', code => resolve(code ?? 1)))
  const listening = new Promise<void>((resolve, reject) => {
    child.stdout.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk)
      if (String(chunk).includes('listening')) resolve()
    })
    void exited.then(code => reject(new EvError(`the web server stopped before it listened (exit ${code})`)))
  })
  process.once('SIGINT', () => child.kill('SIGINT'))
  return { pid: child.pid ?? 0, listening, exited }
}
