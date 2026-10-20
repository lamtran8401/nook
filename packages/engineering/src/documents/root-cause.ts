import { bodyLines, frontMatter } from './markdown.ts'

/** `works/<id>/root-cause.md` of a fix: the type in the front matter, the reason of an unknown type, and the analysis. */
export type RootCause = { type: string; reason: string; analysis: string[] }

const field = (value: unknown) => (value === undefined || value === null ? '' : String(value).trim())

export function parseRootCause(text: string): RootCause {
  const front = frontMatter(text)
  const analysis = bodyLines(text)
    .map(line => line.trim())
    .filter(line => line && !/^#{1,6}\s/.test(line))
  return { type: field(front.type), reason: field(front.reason), analysis }
}
