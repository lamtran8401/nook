import { describe, expect, test } from 'bun:test'

import { startWeb, type WebDeps } from '../../src/web/start.ts'
import type { WebState } from '../../src/web/web-state.ts'

/** Fake parts that log each step; `done` ends the server. */
function fakes(overrides: Partial<WebDeps> = {}) {
  const log: string[] = []
  let state: WebState | null = { port: 4321, pid: 1, started: 'before' }
  let stop: (code: number) => void = () => {}
  const deps: WebDeps = {
    env: {},
    nodeGap: () => null,
    needsBuild: () => true,
    build: () => (log.push('build'), { code: 0, out: 'Compiled', err: '' }),
    writeStamp: () => log.push('stamp'),
    freePort: async preferred => (log.push(`port ${preferred}`), preferred ?? 5000),
    newToken: () => 'tok-secret',
    spawnServer: ({ port, token, desk }) => {
      log.push(`spawn ${port} ${token} ${desk}`)
      return { pid: 77, listening: Promise.resolve(), exited: new Promise<number>(resolve => (stop = resolve)) }
    },
    open: url => log.push(`open ${url}`),
    readState: () => state,
    writeState: next => ((state = next), log.push(`state ${next.port} ${next.pid}`)),
    removeState: () => ((state = null), log.push('state removed')),
    say: line => log.push(`say ${line}`),
    now: () => new Date('2026-10-18T10:00:00.000Z'),
    ...overrides,
  }
  return { deps, log, done: (code = 0) => stop(code), state: () => state }
}

describe('startWeb', () => {
  test('refuses inside Claude Code, and builds and starts nothing', async () => {
    const f = fakes({ env: { CLAUDECODE: '1' } })
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
    const f = fakes({ needsBuild: () => false })
    const run = startWeb('/desk', false, f.deps)
    await Bun.sleep(0)
    f.done()
    await run
    expect(f.log).not.toContain('build')
  })

  test('starts the server on the last port of the desk, keeps its process, opens the address with the token, and never says the token', async () => {
    const f = fakes()
    const run = startWeb('/desk', false, f.deps)
    await Bun.sleep(0)
    expect(f.state()).toEqual({ port: 4321, pid: 77, started: '2026-10-18T10:00:00.000Z' })
    f.done(0)
    expect(await run).toBe(0)
    expect(f.log.filter(l => !l.startsWith('say'))).toEqual([
      'build',
      'stamp',
      'port 4321',
      'spawn 4321 tok-secret /desk',
      'state 4321 77',
      'open http://127.0.0.1:4321/?t=tok-secret',
      'state removed',
    ])
    expect(f.log.filter(l => l.startsWith('say')).join('\n')).not.toContain('tok-secret')
  })

  test('--build builds even when the sources did not change', async () => {
    const f = fakes({ needsBuild: () => false })
    const run = startWeb('/desk', true, f.deps)
    await Bun.sleep(0)
    f.done()
    await run
    expect(f.log).toContain('build')
  })
})
