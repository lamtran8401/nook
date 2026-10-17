import { isOneOf, ITEM_KINDS, SIZES, type Tag } from '../vocabulary.ts'
import { body, frontMatter, hasFrontMatter, inShort, listOf, sections } from './markdown.ts'

/** `works/<id>/spec.md`: the front matter, the In short line, the Why, the AC lines and the questions. */

export type SpecCriterion = { n: number; tag: Tag; text: string }

const AC_LINE = /^-\s+\[(ADD|CHANGE|REMOVE|NONE)\]\s+(.+?)\s*$/
const AC_HEADING = /^##\s+acceptance criteria/i

export class SpecDocument {
  private constructor(
    readonly kind: string | undefined,
    readonly size: string | undefined,
    readonly areas: string[],
    readonly short: string,
    readonly why: string,
    /** `[TAG] text`; the n-th line is AC n. */
    readonly criteria: SpecCriterion[],
    readonly questions: string[],
    readonly problems: string[],
  ) {}

  static parse(text: string): SpecDocument {
    const front = frontMatter(text)
    const parts = sections(text)
    const problems: string[] = []
    if (!hasFrontMatter(text))
      problems.push('no front matter: start the file with --- id, kind, size, areas, created, updated ---')
    const kind = front.kind === undefined ? undefined : String(front.kind).trim()
    const size = front.size === undefined ? undefined : String(front.size).trim().toUpperCase()
    const areas = listOf(front.areas)
    problems.push(...frontProblems(kind, size, areas))
    const why = body(parts.get('why')).join(' ')
    if (!why) problems.push('write the Why')
    const criteria = readCriteria(body(parts.get('acceptance criteria')), problems)
    const questions = body(parts.get('questions'))
      .filter(l => l.startsWith('-'))
      .map(l => l.replace(/^-\s+/, ''))
    return new SpecDocument(kind, size, areas, inShort(text), why, criteria, questions, problems)
  }

  /** The text with `- line` added at the end of the criteria section, or null when the section is missing. */
  static withCriterion(text: string, line: string): string | null {
    const lines = text.split('\n')
    const start = lines.findIndex(l => AC_HEADING.test(l))
    if (start < 0) return null
    let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l))
    if (end < 0) end = lines.length
    while (end > start + 1 && !lines[end - 1]!.trim()) end--
    lines.splice(end, 0, `- ${line}`)
    return lines.join('\n')
  }
}

function frontProblems(kind: string | undefined, size: string | undefined, areas: string[]): string[] {
  const problems: string[] = []
  if (!kind) problems.push('front matter: kind is missing')
  else if (!isOneOf(ITEM_KINDS, kind))
    problems.push(`front matter: kind must be one of ${ITEM_KINDS.join(', ')}`)
  if (!size) problems.push('front matter: size is missing')
  else if (!isOneOf(SIZES, size)) problems.push('front matter: size must be S, M or L')
  if (!areas.length) problems.push('front matter: areas is missing')
  return problems
}

function readCriteria(lines: string[], problems: string[]): SpecCriterion[] {
  const criteria: SpecCriterion[] = []
  for (const line of lines.filter(l => l.startsWith('-'))) {
    const found = AC_LINE.exec(line)
    if (!found) {
      problems.push(
        `acceptance criteria: "${line.slice(0, 60)}" is not a \`- [ADD|CHANGE|REMOVE|NONE] text\` line`,
      )
      continue
    }
    criteria.push({ n: criteria.length + 1, tag: found[1] as Tag, text: `[${found[1]}] ${found[2]}` })
  }
  return criteria
}
