import { describe, expect, test } from 'bun:test'

import { mergeSettings } from '../../src/init/settings.ts'

describe('mergeSettings', () => {
  test('permission lists join in order with no doubles', () => {
    const merged = mergeSettings({ permissions: { allow: ['a'] } }, { permissions: { allow: ['a', 'b'], deny: ['c'] } })
    expect(merged.permissions).toEqual({ allow: ['a', 'b'], ask: [], deny: ['c'] })
  })

  test('a key that the owner set keeps its value; a key that the owner did not set comes from the kit', () => {
    expect(mergeSettings({ theme: 'dark' }, { theme: 'light', outputStyle: 'x' })).toEqual({ theme: 'dark', outputStyle: 'x' })
  })

  test('env merges by variable across packs, and the value of the owner wins', () => {
    const once = mergeSettings({ env: { MINE: '1' } }, { env: { A: '1', MINE: '2' } })
    expect(mergeSettings(once, { env: { B: '1' } }).env).toEqual({ A: '1', MINE: '1', B: '1' })
  })
})
