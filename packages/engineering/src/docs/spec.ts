/** The parser of `work/<id>/spec.md`: front matter, sections, the AC lines, the questions. */

export const ITEM_KINDS = ['feature', 'fix', 'chore', 'investigate'] as const
export const SIZES = ['S', 'M', 'L'] as const
export const TAGS = ['ADD', 'CHANGE', 'REMOVE', 'NONE'] as const
export type ItemKind = (typeof ITEM_KINDS)[number]
export type Size = (typeof SIZES)[number]
export type Tag = (typeof TAGS)[number]

export type Criterion = { n: number; tag: Tag; text: string }
export type Spec = {
  kind?: string
  size?: string
  areas: string[]
  intent: string
  /** `[TAG] text`, the n-th line is AC n. */
  criteria: Criterion[]
  questions: string[]
  problems: string[]
}

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const COMMENT = /<!--[\s\S]*?-->/g
const AC_LINE = /^-\s+\[(ADD|CHANGE|REMOVE|NONE)\]\s+(.+?)\s*$/

/** The text without comments; sections by their `## ` heading, in lower case. */
export function sections(text: string): Map<string, string[]> {
  const found = new Map<string, string[]>()
  let current = ''
  for (const line of text.replace(FRONT, '').replace(COMMENT, '').split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) {
      current = heading[1]!.toLowerCase()
      if (!found.has(current)) found.set(current, [])
      continue
    }
    if (current) found.get(current)!.push(line)
  }
  return found
}

export function frontMatter(text: string): Record<string, unknown> {
  const match = FRONT.exec(text)
  if (!match) return {}
  try {
    const data = Bun.YAML.parse(match[1]!)
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** `areas: [a, b]`, a YAML list, or `areas: a, b`. */
export function listOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean)
  if (typeof value === 'string') return value.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean)
  return []
}

const body = (lines: string[] | undefined) => (lines ?? []).map(l => l.trim()).filter(Boolean)

export function parseSpec(text: string): Spec {
  const front = frontMatter(text)
  const parts = sections(text)
  const problems: string[] = []
  if (!FRONT.test(text)) problems.push('no front matter: start the file with --- id, kind, size, areas ---')
  const kind = front.kind === undefined ? undefined : String(front.kind).trim()
  const size = front.size === undefined ? undefined : String(front.size).trim().toUpperCase()
  const areas = listOf(front.areas)
  if (!kind) problems.push('front matter: kind is missing')
  else if (!ITEM_KINDS.includes(kind as ItemKind)) problems.push(`front matter: kind must be one of ${ITEM_KINDS.join(', ')}`)
  if (!size) problems.push('front matter: size is missing')
  else if (!SIZES.includes(size as Size)) problems.push(`front matter: size must be S, M or L`)
  if (!areas.length) problems.push('front matter: areas is missing')
  const intent = body(parts.get('intent')).join(' ')
  if (!intent) problems.push('write the Intent')
  const criteria: Criterion[] = []
  for (const line of body(parts.get('acceptance criteria'))) {
    if (!line.startsWith('-')) continue
    const match = AC_LINE.exec(line)
    if (!match) {
      problems.push(`acceptance criteria: "${line.slice(0, 60)}" is not a \`- [ADD|CHANGE|REMOVE|NONE] text\` line`)
      continue
    }
    criteria.push({ n: criteria.length + 1, tag: match[1] as Tag, text: `[${match[1]}] ${match[2]}` })
  }
  const questions = body(parts.get('questions')).filter(l => l.startsWith('-')).map(l => l.replace(/^-\s+/, ''))
  return { kind, size, areas, intent, criteria, questions, problems }
}

/** A document is filled when text remains after the front matter, the comments and the headings. */
export function isFilled(text: string): boolean {
  return text.replace(FRONT, '').replace(COMMENT, '').split(/\r?\n/).some(line => line.trim() && !/^#{1,6}\s/.test(line))
}

/** The `## ` sections of a document that hold no text. */
export function emptySections(text: string, wanted: string[]): string[] {
  const parts = sections(text)
  return wanted.filter(name => !body(parts.get(name.toLowerCase())).length)
}

/** findings.md: the questions with an Answer and an Evidence line under `## Q<n>`. */
export function answeredQuestions(text: string): Set<number> {
  const answered = new Set<number>()
  for (const [name, lines] of sections(text)) {
    const match = /^q(\d+)\b/.exec(name)
    if (!match) continue
    const has = (label: string) => lines.some(l => new RegExp(`^\\s*(?:[-*]\\s*)?\\**${label}\\**\\s*:\\s*\\S`, 'i').test(l))
    if (has('answer') && has('evidence')) answered.add(Number(match[1]))
  }
  return answered
}
