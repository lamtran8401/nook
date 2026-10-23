import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { sessionStart } from '../src/hooks/session-start.ts'
import { itemAt, makeHome, type TestHome } from './helpers.ts'
import { reason } from './hook-inputs.ts'

let t: TestHome
beforeEach(() => {
  t = makeHome()
})
afterEach(() => t.cleanup())

describe('sessionStart', () => {
  test('adds the first lines of next', () => {
    itemAt(t, 'framing')
    const result = sessionStart({ cwd: t.root })
    expect(result.kind).toBe('json')
    expect(reason(result)).toContain('Nothing waits for you.')
    expect(reason(result)).toContain('/specify SHOP-1')
  })
})
