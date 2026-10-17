import { describe, expect, test } from 'bun:test'

import { placeBlock } from '../../src/init/claude-block.ts'

const OLD = 'head\n\n<!-- nook:begin -->\nold\n<!-- nook:end -->\n\ntail\n'
const NEW = '<!-- nook:begin -->\nnew\n<!-- nook:end -->'

describe('placeBlock', () => {
  test('replaces the block in place on update, and keeps the text around it', () => {
    expect(placeBlock(OLD, NEW, true)).toBe('head\n\n<!-- nook:begin -->\nnew\n<!-- nook:end -->\n\ntail\n')
  })

  test('leaves a file with a block as it is when update is off', () => {
    expect(placeBlock(OLD, NEW, false)).toBe(OLD)
  })

  test('adds the block after one empty line at the end of a file with no block', () => {
    expect(placeBlock('# Mine\n\n', 'B', false)).toBe('# Mine\n\nB\n')
  })

  test('an empty file gets the block alone', () => {
    expect(placeBlock('', 'B', true)).toBe('B\n')
  })
})
