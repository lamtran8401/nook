import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError, Exit } from '@kit/shared/errors.ts'

import { frontMatter } from '../documents/markdown.ts'

/** Architecture decision records: `<home>/docs/adr/NNNN-title.md`, the status in the front matter. */

export type AdrStatus = 'proposed' | 'accepted' | 'superseded'
export type Adr = {
  n: number
  file: string
  title: string
  status: string
  item: string | null
  by: number | null
  /** The areas of the `Scope:` line under the title. */
  scope: string[]
  /** The first sentence of the Decision section. */
  decision: string
}

const FILE = /^(\d{4})-(.+)\.md$/

const firstSentence = (section: string) => {
  const text = section.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim()
  return /^(.+?[.!?])(?:\s|$)/.exec(text)?.[1] ?? text
}

const body = (n: number, title: string, item: string | undefined, date: string) =>
  `---\nstatus: proposed\ndate: ${date}\n${item ? `item: ${item}\n` : ''}---\n\n# ADR ${n}: ${title}\n\n` +
  '## Context\n\n<!-- the facts that force a decision, with file and line -->\n\n' +
  '## Decision\n\n<!-- the choice, in one or two sentences -->\n\n' +
  '## Options not taken\n\n<!-- each option and why not -->\n\n' +
  '## Consequences\n\n<!-- what gets easier, what gets harder -->\n'

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

export class AdrStore {
  constructor(private readonly dir: string) {}

  list(): Adr[] {
    if (!existsSync(this.dir)) return []
    return readdirSync(this.dir)
      .filter(f => FILE.test(f))
      .sort()
      .map(f => this.read(f))
  }

  find(n: number): Adr | undefined {
    return this.list().find(a => a.n === n)
  }

  create(title: string, item?: string): Adr {
    mkdirSync(this.dir, { recursive: true })
    const n = Math.max(0, ...this.list().map(a => a.n)) + 1
    const file = join(this.dir, `${String(n).padStart(4, '0')}-${slug(title)}.md`)
    writeFileSync(file, body(n, title.trim(), item, new Date().toISOString().slice(0, 10)))
    return this.find(n)!
  }

  /** Writes `status` (and `superseded_by`) into the front matter and keeps its other lines. */
  setStatus(adr: Adr, status: AdrStatus, by?: number): Adr {
    const lines = readFileSync(adr.file, 'utf8').split('\n')
    const end = lines.indexOf('---', 1)
    if (!lines[0]?.startsWith('---') || end < 0)
      throw new EvError(
        `${adr.file} has no front matter`,
        Exit.error,
        'add --- status: proposed --- at the top',
      )
    const front = lines.slice(1, end).filter(l => !/^(status|superseded_by):/.test(l))
    front.unshift(`status: ${status}`)
    if (by) front.push(`superseded_by: ${by}`)
    writeFileSync(adr.file, ['---', ...front, '---', ...lines.slice(end + 1)].join('\n'))
    return this.find(adr.n)!
  }

  private read(name: string): Adr {
    const [, number, fileTitle] = FILE.exec(name)!
    const file = join(this.dir, name)
    const text = readFileSync(file, 'utf8')
    const front = frontMatter(text)
    const title = /^#\s+(?:ADR\s+\d+:\s*)?(.+)$/m.exec(text)?.[1] ?? fileTitle!
    return {
      n: Number(number),
      file,
      title,
      status: String(front.status ?? 'proposed'),
      item: front.item ? String(front.item) : null,
      by: front.superseded_by ? Number(front.superseded_by) : null,
      scope: (/^Scope:\s*(.+)$/m.exec(text)?.[1] ?? '').split(',').map(a => a.trim()).filter(Boolean),
      decision: firstSentence(/^## Decision\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(text)?.[1] ?? ''),
    }
  }
}
