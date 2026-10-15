import { parse } from 'yaml'

/** The parts of a Markdown document of the pack: the front matter, the comments, the `## ` sections. */

export const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
export const COMMENT = /<!--[\s\S]*?-->/g
export const FENCE = /^\s*(```|~~~)/
const IN_SHORT = /^>\s*In short:\s*(.*)$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/

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

/** The lines of a document with no front matter and no comments. */
export const bodyLines = (text: string) => text.replace(FRONT, '').replace(COMMENT, '').split(/\r?\n/)

/** The lines of each `## ` section by its heading in lower case; a `## ` line inside a fence stays text. */
export function sections(text: string): Map<string, string[]> {
  const found = new Map<string, string[]>()
  let current = ''
  let fenced = false
  for (const line of bodyLines(text)) {
    if (FENCE.test(line)) fenced = !fenced
    const heading = fenced ? null : /^##\s+(.+?)\s*$/.exec(line)
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
  return bodyLines(text).some(line => line.trim() && !/^#{1,6}\s/.test(line))
}

/** The wanted sections that hold no text; a mermaid block is text. */
export function emptySections(text: string, wanted: string[]): string[] {
  const parts = sections(text)
  return wanted.filter(name => !body(parts.get(name.toLowerCase())).length)
}

/** The text of the `> In short:` line, or an empty string. */
export function inShort(text: string): string {
  for (const line of bodyLines(text)) {
    const found = IN_SHORT.exec(line.trim())
    if (found) return found[1]!.trim()
  }
  return ''
}

/** A front matter value as a `YYYY-MM-DD` date that exists, or null. */
export function dateOf(value: unknown): string | null {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').trim()
  if (!DATE.test(text)) return null
  const parsed = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(text) ? text : null
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
