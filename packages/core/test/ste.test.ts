import { describe, expect, test } from 'bun:test'

import { problems, score, sentences } from '../src/ste.ts'

const words = (n: number) => `${Array.from({ length: n - 1 }, () => 'word').join(' ')} end.`

describe('problems', () => {
  test('a sentence of 25 words passes', () => {
    expect(problems(words(25))).toEqual([])
  })

  test('a sentence of 26 words fails with its count', () => {
    expect(problems(words(26))).toEqual(['26 words (max 25)'])
  })

  test('a banned word fails, and each one is named', () => {
    expect(problems('You should do it, etc.')).toEqual(['banned: should, etc'])
  })

  test('a banned word between double quotes is mentioned, not used', () => {
    expect(problems('Never write "should" in a rule.')).toEqual([])
  })
})

describe('sentences', () => {
  test('code blocks, tables, headings and front matter are not sentences', () => {
    const text = '---\nid: A\n---\n# Title\n\n| a | b |\n\n```\nyou should not see this\n```\nOne. Two.\n'
    expect(sentences(text)).toEqual(['One.', 'Two.'])
  })

  test('inline code counts as one word', () => {
    expect(sentences('Run `kit eng item show SHOP-12 --json` now.')).toEqual(['Run X now.'])
  })
})

describe('score', () => {
  test('the score is the share of passing sentences, and a file passes only above the minimum', () => {
    const text = 'One. Two. Three. Four. You should stop.'
    expect(score(text)).toMatchObject({ score: 80, sentences: 5, pass: false })
    expect(score(text, '', 79).pass).toBe(true)
  })

  test('a file with no sentence passes', () => {
    expect(score('```\ncode\n```\n')).toMatchObject({ score: 100, sentences: 0, pass: true })
  })
})
