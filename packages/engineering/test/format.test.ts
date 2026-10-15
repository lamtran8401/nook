import { describe, expect, test } from 'bun:test'

import { runText, testCounts } from '../src/format.ts'

const BUN = 'test/a.test.ts:\n(pass) one\n\n 19 pass\n 0 fail\n 22 expect() calls\nRan 19 tests across 2 files. [3.00ms]\n'
const JEST = 'PASS src/a.test.ts\nTests:       1 failed, 2 skipped, 88 passed, 91 total\nTime: 2s\n'

describe('testCounts', () => {
  test('reads the pass and fail counts of bun test', () => {
    expect(testCounts(BUN)).toBe('19 pass, 0 fail')
  })

  test('reads the counts of a jest summary line, the skipped ones too', () => {
    expect(testCounts(JEST)).toBe('1 failed, 2 skipped, 88 passed')
  })

  test('an output with no count gives nothing', () => {
    expect(testCounts('Checked 12 files in 40ms. No fixes applied.')).toBe('')
  })
})

describe('runText', () => {
  test('a passed check shows the counts of its output', () => {
    const run = [{ id: 1, item: 'SHOP-1', area: 'api', check: 'bun test', result: 'pass' as const, output: BUN, at: '2026-10-16' }]
    expect(runText(run)).toBe('✓ api: bun test (19 pass, 0 fail)')
  })
})
