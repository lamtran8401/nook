import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createServer } from 'node:net'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { freePort } from '../../src/web/port.ts'
import { nodeGap } from '../../src/web/node-version.ts'
import { needsBuild, sourceHash, writeStamp } from '../../src/web/source-hash.ts'
import { readWebState, writeWebState } from '../../src/web/web-state.ts'

let root: string
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'nook-web-parts-')))
  write('bun.lock', 'lock')
  write('apps/web/package.json', '{}')
  write('apps/web/app/page.tsx', 'export default 1')
  write('packages/engineering/package.json', '{}')
  write('packages/engineering/src/read.ts', 'export const a = 1')
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const run = (out: string, code = 0) => () => ({ code, out, err: '' })

describe('nodeGap', () => {
  test('is null for Node 24 or later', () => {
    expect(nodeGap(run('v24.21.0\n'))).toBeNull()
    expect(nodeGap(run('v25.1.0\n'))).toBeNull()
  })

  test('names the version and the install for an older Node', () => {
    expect(nodeGap(run('v22.13.0\n'))).toEqual({ text: 'nook web needs Node 24 or later; this is v22.13.0', fix: 'install Node 24, such as `brew install node@24`, then run nook web again' })
  })

  test('names the install when Node is not on the path', () => {
    expect(nodeGap(run('', 127))).toEqual({ text: 'nook web needs Node 24 or later; no node is on the path', fix: 'install Node 24, such as `brew install node@24`, then run nook web again' })
  })
})

describe('sourceHash and the build stamp', () => {
  test('changes when a source of the web app or of a package changes', () => {
    const first = sourceHash(root)
    write('packages/engineering/src/read.ts', 'export const a = 2')
    const second = sourceHash(root)
    write('apps/web/app/page.tsx', 'export default 2')
    expect(new Set([first, second, sourceHash(root)]).size).toBe(3)
  })

  test('does not change for the build, the installed modules or the tests', () => {
    const first = sourceHash(root)
    write('apps/web/.next/server/app/index.html', '<html>')
    write('apps/web/node_modules/next/index.js', 'x')
    write('apps/web/test/gate.test.ts', 'x')
    write('packages/engineering/test/read.test.ts', 'x')
    expect(sourceHash(root)).toBe(first)
  })

  test('changes for the files that steer a build: the root package.json and the tsconfig files', () => {
    write('package.json', '{}')
    write('tsconfig.json', '{}')
    write('packages/engineering/tsconfig.json', '{}')
    const first = sourceHash(root)
    write('package.json', '{"a":1}')
    const second = sourceHash(root)
    write('tsconfig.json', '{"b":1}')
    const third = sourceHash(root)
    write('packages/engineering/tsconfig.json', '{"c":1}')
    expect(new Set([first, second, third, sourceHash(root)]).size).toBe(4)
  })

  test('counts a folder named test inside the sources, and skips a link to a folder', () => {
    const first = sourceHash(root)
    write('apps/web/app/test/page.tsx', 'export default 3')
    const second = sourceHash(root)
    symlinkSync(join(root, 'apps/web/app'), join(root, 'apps/web/linked'))
    expect(second).not.toBe(first)
    expect(sourceHash(root)).toBe(second)
  })

  test('needs a build with no stamp, and none after the stamp of the same sources', () => {
    expect(needsBuild(root)).toBe(true)
    writeStamp(root, sourceHash(root))
    expect(needsBuild(root)).toBe(false)
    write('packages/engineering/src/read.ts', 'export const a = 3')
    expect(needsBuild(root)).toBe(true)
  })

  test('a stamp of the sources from before an edit still needs a build', () => {
    const before = sourceHash(root)
    write('packages/engineering/src/read.ts', 'export const a = 4')
    writeStamp(root, before)
    expect(needsBuild(root)).toBe(true)
  })
})

describe('web.json', () => {
  test('keeps the port and the process of the server, and the port alone after a stop', () => {
    expect(readWebState(root)).toBeNull()
    writeWebState(root, { port: 4321, pid: 99, started: '2026-10-18T10:00:00.000Z' })
    expect(readWebState(root)).toEqual({ port: 4321, pid: 99, started: '2026-10-18T10:00:00.000Z' })
    writeWebState(root, { port: 4321 })
    expect(readWebState(root)).toEqual({ port: 4321 })
  })
})

describe('freePort', () => {
  test('gives the preferred port when it is free', async () => {
    const port = await freePort()
    expect(await freePort(port)).toBe(port)
  })

  test('gives another free port when the preferred one is taken', async () => {
    const taken = createServer().listen(0, '127.0.0.1')
    await new Promise(resolve => taken.once('listening', resolve))
    const port = (taken.address() as { port: number }).port
    const other = await freePort(port)
    taken.close()
    expect(other).not.toBe(port)
    expect(other).toBeGreaterThan(0)
  })
})
