import { describe, expect, test } from 'bun:test'

import { emptySections, isFilled } from '../src/documents/markdown.ts'
import { PLAN } from './helpers.ts'

describe('isFilled', () => {
  test('a document with only front matter, headings and comments is not filled', () => {
    expect(isFilled('---\nid: x\n---\n# t\n\n## A\n\n<!-- guidance -->\n')).toBe(false)
  })

  test('a line of text under a heading fills the document', () => {
    expect(isFilled('# t\n\n## A\n\ntext\n')).toBe(true)
  })
})

describe('emptySections', () => {
  test('names the wanted sections that hold no text', () => {
    expect(emptySections(PLAN.replace('Time zones.\n', ''), ['Architecture', 'Risks'])).toEqual(['Risks'])
  })
})
