import { parse } from 'yaml'

/** The parts of a Markdown document of the pack: the front matter, the comments, the `## ` sections. */

export const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
export const COMMENT = /<!--[\s\S]*?-->/g

export const hasFrontMatter = (text: string) => FRONT.test(text)

/** The front matter as a map; a missing or broken one gives an empty map. */
export function frontMatter(text: string): Record<string, unknown> {
  const found = FRONT.exec(text)
  if (!found) return {}
  try {
    const data: unknown = parse(found[1]!)
    return typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/** The lines of each `## ` section by its heading in lower case, with no front matter and no comments. */
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

/** The lines of a section that hold text, trimmed. */
export const body = (lines: string[] | undefined) => (lines ?? []).map(l => l.trim()).filter(Boolean)

/** A document is filled when text remains after the front matter, the comments and the headings. */
export function isFilled(text: string): boolean {
  return text
    .replace(FRONT, '')
    .replace(COMMENT, '')
    .split(/\r?\n/)
    .some(line => line.trim() && !/^#{1,6}\s/.test(line))
}

export function emptySections(text: string, wanted: string[]): string[] {
  const parts = sections(text)
  return wanted.filter(name => !body(parts.get(name.toLowerCase())).length)
}

/** `[a, b]` as a YAML list, or `a, b` as text. */
export function listOf(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .map(String)
      .map(s => s.trim())
      .filter(Boolean)
  if (typeof value === 'string')
    return value
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  return []
}
