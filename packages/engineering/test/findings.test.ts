import { describe, expect, test } from 'bun:test'

import { answeredQuestions } from '../src/documents/findings.ts'

describe('answeredQuestions', () => {
  test('counts a question only when it has an Answer line and an Evidence line with text', () => {
    expect([...answeredQuestions('## Q1\n\n- Answer: a\n- Evidence: b\n\n## Q2\n\n**Answer**: a\nEvidence:\n\n## Q3\nAnswer: x\nEvidence: y\n')]).toEqual([1, 3])
  })
})
