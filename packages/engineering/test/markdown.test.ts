import { describe, expect, test } from 'bun:test'

import { dateOf, emptySections, inShort, isFilled, sections } from '../src/documents/markdown.ts'
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
    expect(emptySections(PLAN.replace('Time zones.\n', ''), ['Today', 'Risks'])).toEqual(['Risks'])
  })
})

describe('sections', () => {
  test('a ## line inside a fenced block stays text of its section', () => {
    const parts = sections('## Today\n\n```text\n## not a heading\n```\n\n## Risks\n\nnone\n')
    expect([...parts.keys()]).toEqual(['today', 'risks'])
    expect(parts.get('today')).toContain('## not a heading')
  })
})

describe('inShort', () => {
  test('gives the text of the In short line', () => {
    expect(inShort('---\nid: x\n---\n# x\n\n> In short: one filter for the list.\n\n## Why\n')).toBe('one filter for the list.')
  })

  test('gives an empty text when the line is only in a comment', () => {
    expect(inShort('# x\n\n<!-- > In short: the guidance -->\n')).toBe('')
  })
})

describe('dateOf', () => {
  test('keeps a YYYY-MM-DD date that exists', () => {
    expect(dateOf('2026-10-15')).toBe('2026-10-15')
  })

  test('refuses a day that does not exist and a text in another form', () => {
    expect([dateOf('2026-02-30'), dateOf('15.10.2026'), dateOf(undefined)]).toEqual([null, null, null])
  })
})
