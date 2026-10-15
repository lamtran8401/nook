import { describe, expect, test } from 'bun:test'

import { classify, isTestFile } from '../src/git/prover.ts'

describe('classify', () => {
  test('a pass on the base is weak, a load error is none, a failure is proven', () => {
    expect(classify(0, 'ok').proof).toBe('weak')
    expect(classify(1, "Error: Cannot find module './x'").proof).toBe('none')
    expect(classify(1, 'expect(received).toBe(expected)').proof).toBe('proven')
  })

  test('a missing export of a file that the branch changes is proven: the tests need the new code', () => {
    const output = "SyntaxError: Export named 'STATUSES' not found in module '/home/.kit/prove/IT-1-T1/src/shipments.ts'."
    expect(classify(1, output, ['src/shipments.ts'])).toEqual({
      proof: 'proven',
      note: "the tests fail on the base because they need code that the branch adds (src/shipments.ts): SyntaxError: Export named 'STATUSES' not found in module '/home/.kit/prove/IT-1-T1/src/shipments.ts'.",
    })
  })

  test('a missing module that the branch adds is proven', () => {
    expect(classify(1, "error: Cannot find module '../src/page.ts' from '/home/test/page.test.ts'", ['src/page.ts']).proof).toBe('proven')
  })

  test('a load error that names no code of the branch stays none', () => {
    expect(classify(1, "error: Cannot find package 'happy-dom' from '/home/test/page.test.ts'", ['src/page.ts']).proof).toBe('none')
  })
})

describe('isTestFile', () => {
  test('knows the test folders and the test file names, and nothing else', () => {
    expect(['tests/a.sh', 'src/__tests__/a.ts', 'a.test.ts', 'a.spec.js', 'a_test.go', 'test_a.py'].every(isTestFile)).toBe(true)
    expect(['src/a.ts', 'testing.ts'].some(isTestFile)).toBe(false)
  })
})
