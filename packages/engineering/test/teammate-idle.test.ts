import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { teammateIdle } from '../src/hooks/teammate-idle.ts'
import { BUILDER, itemAt, makeHome, type TestHome } from './helpers.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('teammateIdle', () => {
  test('a teammate named <area>-builder is held with exit 2 while a slice of its area runs', () => {
    itemAt(t, 'cooking')
    t.eng(BUILDER).moveSlice('start', 'SHOP-1', 'T1')
    const idle = teammateIdle({ cwd: t.root, teammate_name: 'bff-builder', team_name: 'nook' })
    expect(idle.kind).toBe('block')
    expect((idle as { reason: string }).reason).toContain('nook eng task done')
    expect(teammateIdle({ cwd: t.root, teammate_name: 'frontend-builder' }).kind).toBe('pass')
    expect(teammateIdle({ cwd: t.root, teammate_name: 'scout' }).kind).toBe('pass')
  })
})
