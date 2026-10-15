import { describe, expect, test } from 'bun:test'

import { classify, isTestFile } from '../src/git/prover.ts'

describe('classify', () => {
  test('a pass on the base is weak, a load error is none, a failure is proven', () => {
    expect(classify(0, 'ok').proof).toBe('weak')
    expect(classify(1, "Error: Cannot find module './x'").proof).toBe('none')
    expect(classify(1, 'expect(received).toBe(expected)').proof).toBe('proven')
  })
})

describe('isTestFile', () => {
  test('knows the test folders and the test file names, and nothing else', () => {
    expect(['tests/a.sh', 'src/__tests__/a.ts', 'a.test.ts', 'a.spec.js', 'a_test.go', 'test_a.py'].every(isTestFile)).toBe(true)
    expect(['src/a.ts', 'testing.ts'].some(isTestFile)).toBe(false)
  })
})
