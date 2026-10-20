import { describe, expect, test } from 'bun:test'

import { statSync, readFileSync, rmSync } from 'node:fs'

import { forgetWeb, pairWeb, serverEnv, startWeb, type WebDeps, writeOpenPage } from '../../src/web/start.ts'
import type { WebState } from '../../src/web/web-state.ts'

/** Fake parts that log each step; `done` ends the server. */
function fakes(overrides: Partial<WebDeps> = {}) {
  const log: string[] = []
  let state: WebState | null = { port: 4321, pid: 1, started: 'before' }
  let stop: (code: number) => void = () => {}
  const deps: WebDeps = {
    insideClaude: () => false,
    alive: () => false,
    nodeGap: () => null,
    sources: () => ({ hash: 'h1', built: false }),
    build: () => (log.push('build'), { code: 0, out: 'Compiled', err: '' }),
    writeStamp: hash => log.push(`stamp ${hash}`),
    freePort: async preferred => (log.push(`port ${preferred}`), preferred ?? 5000),
    offerPair: () => (log.push('pair offered'), 'tok-secret'),
    forgetPairs: () => 2,
    spawnServer: ({ port, desk }) => {
      log.push(`spawn ${port} ${desk}`)
      return { pid: 77, listening: Promise.resolve(), exited: new Promise<number>(resolve => (stop = resolve)) }
    },
    open: url => log.push(`open ${url}`),
    readState: () => state,
    writeState: next => ((state = next), log.push(`state ${JSON.stringify(next)}`)),
    say: line => log.push(`say ${line}`),
    now: () => new Date('2026-10-18T10:00:00.000Z'),
    ...overrides,
  }
  return { deps, log, done: (code = 0) => stop(code), state: () => state }
}

describe('serverEnv', () => {
  test('gives the server its desk, its port and the command of this nook, and keeps the rest of the environment', () => {
    expect(serverEnv('/desk', 4321, { HOME: '/home/me' }, ['/bin/bun', '/nook/apps/nook/src/main.ts'])).toEqual({
      HOME: '/home/me', NOOK_DESK: '/desk', NOOK_WEB_PORT: '4321', NOOK_CLI: '["/bin/bun","/nook/apps/nook/src/main.ts"]',
    })
  })
})

describe('startWeb', () => {
  test('refuses inside Claude Code, and builds and starts nothing', async () => {
    const f = fakes({ insideClaude: () => true })
    await expect(startWeb('/desk', false, f.deps)).rejects.toMatchObject({ message: 'nook web starts only in your own terminal, not in Claude Code', fix: 'open a terminal in the desk and run `nook web`' })
    expect(f.log).toEqual([])
  })

  test('refuses a Node older than 24 before any build', async () => {
    const f = fakes({ nodeGap: () => ({ text: 'nook web needs Node 24 or later; this is v22.1.0', fix: 'install Node 24' }) })
    await expect(startWeb('/desk', false, f.deps)).rejects.toMatchObject({ message: 'nook web needs Node 24 or later; this is v22.1.0', fix: 'install Node 24' })
    expect(f.log).toEqual([])
  })

  test('a failed build names its error lines, writes no stamp, and starts no server', async () => {
    const f = fakes({ build: () => ({ code: 1, out: 'Creating an optimized build\nError: Module not found: x', err: '' }) })
    await expect(startWeb('/desk', false, f.deps)).rejects.toMatchObject({ message: 'the build of the web app failed:\nError: Module not found: x' })
    expect(f.log.filter(l => !l.startsWith('say'))).toEqual([])
  })

  test('a second start with no change of the sources builds nothing', async () => {
    const f = fakes({ sources: () => ({ hash: 'h1', built: true }) })
    const run = startWeb('/desk', false, f.deps)
    await Bun.sleep(0)
    f.done()
    await run
    expect(f.log).not.toContain('build')
  })

  test('starts the server on the last port of the desk, opens the address with a new pair token, never says the token, and keeps the port after the stop', async () => {
    const f = fakes()
    const run = startWeb('/desk', false, f.deps)
    await Bun.sleep(0)
    expect(f.state()).toEqual({ port: 4321, pid: 77, started: '2026-10-18T10:00:00.000Z' })
    f.done(0)
    expect(await run).toBe(0)
    expect(f.log.filter(l => !l.startsWith('say'))).toEqual([
      'build',
      'stamp h1',
      'port 4321',
      'spawn 4321 /desk',
      'state {"port":4321,"pid":77,"started":"2026-10-18T10:00:00.000Z"}',
      'pair offered',
      'open http://127.0.0.1:4321/?t=tok-secret',
      'state {"port":4321}',
    ])
    expect(f.log.filter(l => l.startsWith('say')).join('\n')).not.toContain('tok-secret')
    // the server prints the banner with the address, so nook web says nothing more after the build
    expect(f.log.filter(l => l.startsWith('say'))).toEqual(['say nook web: building the web app, about a minute'])
  })

  test('--build builds even when the sources did not change', async () => {
    const f = fakes({ sources: () => ({ hash: 'h1', built: true }) })
    const run = startWeb('/desk', true, f.deps)
    await Bun.sleep(0)
    f.done()
    await run
    expect(f.log).toContain('build')
  })

  test('says so when another program holds the last port, and takes a free one', async () => {
    const f = fakes({ sources: () => ({ hash: 'h1', built: true }), freePort: async () => 5000 })
    const run = startWeb('/desk', false, f.deps)
    await Bun.sleep(0)
    f.done()
    await run
    expect(f.log).toContain('say nook web: another program holds port 4321, so the address is now http://127.0.0.1:5000')
    expect(f.state()).toEqual({ port: 5000 })
  })

  test('refuses while the server of an earlier start still runs for the desk', async () => {
    const f = fakes({ alive: pid => pid === 1 })
    await expect(startWeb('/desk', false, f.deps)).rejects.toMatchObject({ message: 'nook web already runs for this desk on port 4321', fix: 'use its tab, or stop it with Ctrl-C in its terminal' })
    expect(f.log).toEqual([])
  })
})

describe('pairWeb', () => {
  test('prints a new pair link on the port of the server that runs', () => {
    const f = fakes({ alive: pid => pid === 1 })
    expect(pairWeb(f.deps)).toBe(0)
    expect(f.log).toEqual(['pair offered', 'say Open this link in the browser to pair, within 2 minutes; it works once:\nhttp://127.0.0.1:4321/?t=tok-secret'])
  })

  test('refuses inside Claude Code, and offers no token', () => {
    const f = fakes({ insideClaude: () => true, alive: () => true })
    expect(() => pairWeb(f.deps)).toThrow(expect.objectContaining({ message: 'nook web pair runs only in your own terminal, not in Claude Code' }))
    expect(f.log).toEqual([])
  })

  test('refuses when nook web does not run for the desk', () => {
    const f = fakes()
    expect(() => pairWeb(f.deps)).toThrow(expect.objectContaining({ message: 'nook web does not run for this desk', fix: 'run `nook web` first, then `nook web pair` in another terminal' }))
    expect(f.log).toEqual([])
  })
})

describe('forgetWeb', () => {
  test('removes each pair and says how many', () => {
    const f = fakes()
    expect(forgetWeb(f.deps)).toBe(0)
    expect(f.log).toEqual(['say nook web: removed 2 paired browsers; nook web pairs your browser again'])
  })

  test('refuses inside Claude Code', () => {
    const f = fakes({ insideClaude: () => true, forgetPairs: () => { throw new Error('forgot') } })
    expect(() => forgetWeb(f.deps)).toThrow(expect.objectContaining({ message: 'nook web forget runs only in your own terminal, not in Claude Code' }))
  })
})

describe('writeOpenPage', () => {
  test('writes a page that only the owner can read, sends no referrer, and goes to the address', () => {
    const { dir, page } = writeOpenPage('http://127.0.0.1:4321/?t=tok')
    expect(statSync(page).mode & 0o777).toBe(0o600)
    expect(statSync(dir).mode & 0o777).toBe(0o700)
    expect(readFileSync(page, 'utf8')).toBe('<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><script>location.replace("http://127.0.0.1:4321/?t=tok")</script>')
    rmSync(dir, { recursive: true, force: true })
  })
})
