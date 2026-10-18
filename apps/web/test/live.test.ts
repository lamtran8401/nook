import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GET } from '../app/live/route.ts'
import { watchDesk } from '../lib/watch.ts'

let desk: string
beforeEach(() => {
  desk = realpathSync(mkdtempSync(join(tmpdir(), 'nook-live-')))
  writeFileSync(join(desk, 'nook.yml'), 'packs: [engineering]\n')
  mkdirSync(join(desk, 'works', 'SHOP-42'), { recursive: true })
  mkdirSync(join(desk, '.nook'), { recursive: true })
  mkdirSync(join(desk, 'projects', 'api'), { recursive: true })
})
afterEach(() => rmSync(desk, { recursive: true, force: true }))

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The number of changes that the watch reports while `act` runs and for 1.5 s after. */
async function changesDuring(act: () => void): Promise<number> {
  let count = 0
  const stop = watchDesk(desk, () => count++, 200)
  await wait(100)
  act()
  await wait(1500)
  stop()
  return count
}

describe('watchDesk', () => {
  test('reports one change when an agent writes a document of an item', async () => {
    expect(await changesDuring(() => writeFileSync(join(desk, 'works', 'SHOP-42', 'plan.md'), '# the plan\n'))).toBe(1)
  })

  test('reports one change when the ledger writes in .nook, as a move of a slice does', async () => {
    expect(await changesDuring(() => writeFileSync(join(desk, '.nook', 'engineering.db-wal'), 'x'))).toBe(1)
  })

  test('reports nothing for a change in the code of an area', async () => {
    expect(await changesDuring(() => writeFileSync(join(desk, 'projects', 'api', 'index.ts'), 'x'))).toBe(0)
  })
})

describe('GET /live', () => {
  test('streams an event when the desk changes, and stops when the page goes away', async () => {
    const before = process.env.NOOK_DESK
    process.env.NOOK_DESK = desk
    const leave = new AbortController()
    const response = GET(new Request('http://127.0.0.1/live', { signal: leave.signal }))
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const reader = response.body!.getReader()
    const decode = new TextDecoder()
    await reader.read()
    setTimeout(() => writeFileSync(join(desk, 'works', 'SHOP-42', 'tasks.md'), '# the slices\n'), 100)
    const { value } = await reader.read()
    expect(decode.decode(value)).toBe('event: change\ndata: {}\n\n')
    leave.abort()
    expect((await reader.read()).done).toBe(true)
    if (before === undefined) delete process.env.NOOK_DESK
    else process.env.NOOK_DESK = before
  })
})
