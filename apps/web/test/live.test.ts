import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GET } from '@/app/[workspace]/live/route.ts'
import { listWorkspaces } from '@/lib/workspaces.ts'
import { watchWorkspace } from '@/lib/watch.ts'

let workspace: string
beforeEach(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'nook-live-')))
  writeFileSync(join(workspace, 'nook.yml'), 'engineering: {}\n')
  mkdirSync(join(workspace, 'works', 'SHOP-42'), { recursive: true })
  mkdirSync(join(workspace, '.nook'), { recursive: true })
  mkdirSync(join(workspace, 'projects', 'api'), { recursive: true })
})
afterEach(() => rmSync(workspace, { recursive: true, force: true }))

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The number of changes that the watch reports while `act` runs and for 1.5 s after. */
async function changesDuring(act: () => void): Promise<number> {
  let count = 0
  // the folders that beforeEach made can still send their events; let them land before the watch starts
  await wait(400)
  const stop = watchWorkspace(workspace, () => count++, 200)
  await wait(100)
  act()
  await wait(1500)
  stop()
  return count
}

describe('watchWorkspace', () => {
  test('reports one change when an agent writes a document of an item', async () => {
    expect(await changesDuring(() => writeFileSync(join(workspace, 'works', 'SHOP-42', 'plan.md'), '# the plan\n'))).toBe(1)
  })

  test('reports one change when the ledger writes in .nook, as a move of a slice does', async () => {
    expect(await changesDuring(() => writeFileSync(join(workspace, '.nook', 'engineering.db-wal'), 'x'))).toBe(1)
  })

  test('reports nothing for a change in the code of an area', async () => {
    expect(await changesDuring(() => writeFileSync(join(workspace, 'projects', 'api', 'index.ts'), 'x'))).toBe(0)
  })
})

describe('GET /live', () => {
  test('streams an event when the workspace changes, and stops when the page goes away', async () => {
    const before = { workspace: process.env.NOOK_WORKSPACE, config: process.env.XDG_CONFIG_HOME }
    process.env.NOOK_WORKSPACE = workspace
    // the workspace list of the test lives in its own folder, never in the home of the owner
    process.env.XDG_CONFIG_HOME = workspace
    const leave = new AbortController()
    const slug = listWorkspaces()[0]!.slug
    const response = await GET(new Request(`http://127.0.0.1/${slug}/live`, { signal: leave.signal }), { params: Promise.resolve({ workspace: slug }) })
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const reader = response.body!.getReader()
    const decode = new TextDecoder()
    await reader.read()
    setTimeout(() => writeFileSync(join(workspace, 'works', 'SHOP-42', 'tasks.md'), '# the slices\n'), 100)
    const { value } = await reader.read()
    expect(decode.decode(value)).toBe('event: change\ndata: {}\n\n')
    leave.abort()
    expect((await reader.read()).done).toBe(true)
    for (const [name, value] of [['NOOK_WORKSPACE', before.workspace], ['XDG_CONFIG_HOME', before.config]] as const) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  })
})
