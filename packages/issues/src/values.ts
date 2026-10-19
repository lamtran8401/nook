import { adfToMarkdown, isAdf } from './adf.ts'

/** The value of a Jira field as text: a string, rich text as Markdown, a number, a list, or the name of an option, a person or a sprint. */
export function valueText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (isAdf(value)) return adfToMarkdown(value) || null
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(', ') || null
  if (typeof value === 'object') {
    const named = value as Record<string, unknown>
    for (const key of ['value', 'name', 'displayName', 'title', 'key']) if (typeof named[key] === 'string') return (named[key] as string).trim() || null
  }
  return null
}

/** A value that needs a part of its own in a ticket: rich text, a line break, or more than 80 characters. */
export function isLong(value: unknown): boolean {
  if (isAdf(value)) return true
  const text = valueText(value) ?? ''
  return text.includes('\n') || text.length > 80
}
