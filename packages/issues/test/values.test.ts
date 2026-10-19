import { describe, expect, test } from 'bun:test'

import { isLong, valueText } from '../src/values.ts'

describe('valueText', () => {
  test('a string, a number and nothing', () => {
    expect([valueText('  words '), valueText(3), valueText(null), valueText(undefined), valueText('')]).toEqual(['words', '3', null, null, null])
  })

  test('rich text of Jira becomes Markdown', () => {
    expect(valueText({ type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Given a cart' }] }] })).toBe('Given a cart')
  })

  test('an option, a person, a sprint and a list read as their names', () => {
    expect(valueText({ value: 'High' })).toBe('High')
    expect(valueText({ displayName: 'Ana Lee', accountId: 'x' })).toBe('Ana Lee')
    expect(valueText([{ id: 1, name: 'Sprint 12', state: 'active' }])).toBe('Sprint 12')
    expect(valueText(['a', { value: 'b' }])).toBe('a, b')
  })
})

describe('isLong', () => {
  test('rich text, a line break or more than 80 characters makes a value long', () => {
    expect(isLong({ type: 'doc', content: [] })).toBe(true)
    expect(isLong('a\nb')).toBe(true)
    expect(isLong('x'.repeat(81))).toBe(true)
    expect(isLong('Sprint 12')).toBe(false)
    expect(isLong([{ name: 'Sprint 12' }])).toBe(false)
  })
})
