import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { FeatureModule } from '@nook/workspace/workspaces.ts'

import { readHome } from '../src/read.ts'

let workspace: string
beforeEach(() => {
  workspace = realpathSync(mkdtempSync(join(tmpdir(), 'nook-read-')))
  writeFileSync(join(workspace, 'nook.yml'), 'engineering: {}\n')
})
afterEach(() => rmSync(workspace, { recursive: true, force: true }))

const GAP = { level: 'warn' as const, where: 'SHOP-2', text: 'SHOP-2: plan.md changed after the approve', fix: 'nook eng item replan SHOP-2' }
const feature: FeatureModule = {
  name: 'engineering',
  setup: () => [],
  configured: () => true,
  doctor: () => [GAP],
  brief: (_dir, since) => [
    { part: 'waits', text: 'SHOP-1 waits for your approve', action: '/gate approve SHOP-1' },
    { part: 'done', text: `SHOP-0 closed since ${since.toISOString().slice(0, 10)}` },
  ],
}

describe('readHome', () => {
  test('gives the gaps of the doctor, and the brief of the workspace with those gaps first as urgent waits', () => {
    const home = readHome(workspace, [feature], new Date(2026, 9, 18, 12))
    expect(home.dir).toBe(workspace)
    expect(home.findings).toContainEqual({ ...GAP, text: 'engineering: SHOP-2: plan.md changed after the approve' })
    expect(home.brief).toContainEqual({ part: 'waits', urgent: true, text: 'engineering: SHOP-2: plan.md changed after the approve', action: 'nook eng item replan SHOP-2' })
    expect(home.brief.slice(-2)).toEqual([
      { part: 'waits', text: 'SHOP-1 waits for your approve', action: '/gate approve SHOP-1' },
      { part: 'done', text: `SHOP-0 closed since ${new Date(2026, 9, 17).toISOString().slice(0, 10)}` },
    ])
  })

  test('gives no line of a feature that the workspace does not turn on', () => {
    writeFileSync(join(workspace, 'nook.yml'), 'secrets: []\n')
    expect(readHome(workspace, [feature]).brief.map(l => l.text)).not.toContain('SHOP-1 waits for your approve')
  })
})
