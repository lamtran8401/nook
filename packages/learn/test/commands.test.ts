import { describe, expect, test } from 'bun:test'

import { reviewArgs } from '../src/commands.ts'

describe('reviewArgs', () => {
  test('takes the course when three words come, and the only course when two come', () => {
    expect(reviewArgs(['english', 'C1', 'good'])).toEqual({ name: 'english', id: 'C1', result: 'good' })
    expect(reviewArgs(['C2', 'again'])).toEqual({ id: 'C2', result: 'again' })
  })

  test('a result that is not good or again is refused', () => {
    expect(() => reviewArgs(['C1', 'maybe'])).toThrow('give the card and good or again')
  })
})
