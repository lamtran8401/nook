import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A rough check of ASD-STE100 for Markdown. A sentence passes with 25 words or fewer and none of the banned words.
 * The score is the share of passing sentences. A file passes when the score is above the minimum (default 80).
 */
export const MAX_WORDS = 25
export const BANNED = ['should', 'may', 'might', 'etc', 'very', 'really', 'extremely']

export type Failure = { sentence: string; why: string[] }
export type Score = { file: string; score: number; sentences: number; pass: boolean; failures: Failure[] }

const FENCE = /^\s*(```|~~~)/
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/
const COMMENT = /<!--[\s\S]*?-->/g
const WORD = /[A-Za-z0-9][A-Za-z0-9'’_-]*/g
// A period ends a sentence when a space and a capital, a digit, a quote or a bracket follow.
const SPLIT = /(?<=[.!?:;])\s+(?=[A-Z0-9`"'([])/

const clean = (raw: string) =>
  raw
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`[^`]*`/g, 'X')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_]{1,3}/g, '')
    .trim()

/** A table cell with fewer words is a label, such as `low` or `run`, not a sentence. */
const CELL_WORDS = 4

/** The cells of a body row that hold a sentence. */
const tableCells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => clean(cell))
    .filter(cell => (cell.match(WORD)?.length ?? 0) >= CELL_WORDS)

function lines(text: string): string[] {
  const kept: string[] = []
  let fenced = false
  let inTable = false
  for (const raw of text.replace(FRONT_MATTER, '').replace(COMMENT, '').split(/\r?\n/)) {
    if (FENCE.test(raw)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    if (raw.trimStart().startsWith('|')) {
      // the first row of a table is its header, the next its separator
      const body = inTable && !/^\s*\|[\s:|-]+\|?\s*$/.test(raw)
      inTable = true
      if (body) kept.push(...tableCells(raw))
      continue
    }
    inTable = false
    if (/^\s*#{1,6}\s/.test(raw) || /^\s*(-{3,}|\*{3,})\s*$/.test(raw)) continue
    const line = clean(raw)
    if (line) kept.push(line)
  }
  return kept
}

export const sentences = (text: string) =>
  lines(text).flatMap(line => line.split(SPLIT).map(part => part.trim()).filter(Boolean))

export function problems(sentence: string): string[] {
  const found: string[] = []
  const count = sentence.match(WORD)?.length ?? 0
  if (count > MAX_WORDS) found.push(`${count} words (max ${MAX_WORDS})`)
  // A word between straight double quotes is mentioned, not used.
  const used = new Set((sentence.replace(/"[^"]*"/g, '').match(WORD) ?? []).map(word => word.toLowerCase().replace(/^['’_-]+|['’_-]+$/g, '')))
  const banned = BANNED.filter(word => used.has(word))
  if (banned.length) found.push(`banned: ${banned.join(', ')}`)
  return found
}

export function score(text: string, file = '', minimum = 80): Score {
  const all = sentences(text)
  const failures = all.flatMap(sentence => {
    const why = problems(sentence)
    return why.length ? [{ sentence, why }] : []
  })
  const percent = all.length === 0 ? 100 : (100 * (all.length - failures.length)) / all.length
  return { file, score: Math.round(percent * 10) / 10, sentences: all.length, pass: percent > minimum, failures }
}

/** The Markdown files of a path: the file itself, or every .md file under a folder (not in dot folders). */
export function markdownFiles(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path]
  return readdirSync(path, { withFileTypes: true })
    .filter(entry => !entry.name.startsWith('.') && entry.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => {
      const full = join(path, entry.name)
      return entry.isDirectory() ? markdownFiles(full) : entry.name.endsWith('.md') ? [full] : []
    })
}

export const scoreFile = (file: string, minimum = 80) => score(readFileSync(file, 'utf8'), file, minimum)
