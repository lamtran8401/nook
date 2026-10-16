import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, normalize, relative } from 'node:path'

import type { Finding } from '@kit/env/env.ts'
import { usage } from '@kit/shared/errors.ts'

import type { Shelf, WikiConfig } from './config.ts'
import { addRows, type IndexLine, indexRow, parseIndex, removeRows } from './index-file.ts'

/** The wiki of one environment: its shelves, their pages and their indexes. The kit adds lines; it never removes one. */

const INDEX = 'INDEX.md'
const TABLE = '| Page | Type | Summary |\n|---|---|---|'
const TOP_TABLE = '| Shelf | Use |\n|---|---|'
const FIX = 'kit wiki index --fix'

/** The type of a page with no `type:` in its front matter. */
const SHELF_TYPES: Record<string, string> = { ideas: 'idea', areas: 'area', resources: 'resource' }

export type BrokenLink = { page: string; link: string }

export class Wiki {
  constructor(
    readonly home: string,
    readonly config: WikiConfig,
  ) {}

  get dir(): string {
    return join(this.home, this.config.dir)
  }

  /** The pages of a shelf, relative to the shelf, its index left out. */
  pages(shelf: Shelf): string[] {
    const dir = join(this.dir, shelf.name)
    return existsSync(dir) ? markdownIn(dir).filter(page => page !== INDEX) : []
  }

  check(): Finding[] {
    const gaps: Finding[] = []
    const top = join(this.dir, INDEX)
    if (!existsSync(top)) gaps.push(gap(`${this.config.dir}/${INDEX} is missing`, FIX))
    else {
      const named = readFileSync(top, 'utf8')
      for (const shelf of this.config.shelves)
        if (!new RegExp(`\\|\\s*\\[?${shelf.name}\\b`).test(named)) gaps.push(gap(`${this.config.dir}/${INDEX} has no line for the shelf ${shelf.name}`, FIX))
    }
    for (const shelf of this.config.shelves.filter(s => s.index)) {
      const file = join(this.dir, shelf.name, INDEX)
      if (!existsSync(file)) {
        gaps.push(gap(`${shelf.name}/${INDEX} is missing`, FIX))
        continue
      }
      const lines = parseIndex(readFileSync(file, 'utf8'))
      const pages = this.pages(shelf)
      for (const page of pages) if (!lines.some(l => l.page === page)) gaps.push(gap(`${shelf.name}/${page} has no line in ${shelf.name}/${INDEX}`, FIX))
      for (const line of lines)
        if (!pages.includes(line.page)) gaps.push(gap(`${shelf.name}/${INDEX} names ${line.page}, which does not exist`, 'restore the page, or remove the line'))
    }
    return gaps
  }

  /** Makes each missing index and adds a line for each page with none; returns what it did. */
  fix(): string[] {
    const done: string[] = []
    mkdirSync(this.dir, { recursive: true })
    const top = join(this.dir, INDEX)
    const topText = existsSync(top) ? readFileSync(top, 'utf8') : '# Wiki\n\nOne shelf for each kind of page. Each shelf keeps its own index.\n'
    const missingShelves = this.config.shelves.filter(s => !new RegExp(`\\|\\s*\\[?${s.name}\\b`).test(topText))
    if (!existsSync(top) || missingShelves.length) {
      writeFileSync(top, addRows(topText, missingShelves.map(shelfRow), TOP_TABLE))
      done.push(`${INDEX}: ${missingShelves.length} shelves`)
    }
    for (const shelf of this.config.shelves.filter(s => s.index)) {
      const file = join(this.dir, shelf.name, INDEX)
      const text = existsSync(file) ? readFileSync(file, 'utf8') : `# ${title(shelf.name)}\n\n${shelf.use}\n`
      const known = parseIndex(text).map(l => l.page)
      const fresh = this.pages(shelf).filter(page => !known.includes(page))
      if (existsSync(file) && !fresh.length) continue
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, addRows(text, fresh.map(page => indexRow(this.lineFor(shelf, page))), TABLE))
      done.push(...(fresh.length ? fresh.map(page => `${shelf.name}/${INDEX}: a line for ${page}`) : [`${shelf.name}/${INDEX}: made`]))
    }
    return done
  }

  /** Each `[[name]]` with no page of that name, and each relative Markdown link to a file that does not exist. */
  brokenLinks(): BrokenLink[] {
    const all = markdownIn(this.dir)
    const names = new Set(all.map(page => basename(page, '.md')))
    const broken: BrokenLink[] = []
    for (const page of all) {
      const text = readFileSync(join(this.dir, page), 'utf8')
      for (const m of text.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g))
        if (!names.has(m[1]!.trim())) broken.push({ page, link: `[[${m[1]!.trim()}]]` })
      for (const m of text.matchAll(/\]\(([^)\s]+\.md)(?:#[^)]*)?\)/g)) {
        const target = m[1]!
        if (/^[a-z]+:\/\//i.test(target)) continue
        if (!existsSync(join(this.dir, dirname(page), target))) broken.push({ page, link: target })
      }
    }
    return broken
  }

  /**
   * After a combined page replaces `pages` (paths in the wiki, such as `resources/cart.md`): each one moves to
   * `<archive>/<date>/`, leaves its index, and each link to it points at `into`. Returns what it did.
   */
  retire(pages: string[], into: string, date: string): string[] {
    for (const page of [into, ...pages])
      if (!existsSync(join(this.dir, page))) throw usage(`${page} does not exist`, 'write the combined page first, then retire the old ones')
    const done: string[] = []
    for (const page of pages) {
      const to = join(this.home, this.config.archive, date, page)
      mkdirSync(dirname(to), { recursive: true })
      renameSync(join(this.dir, page), to)
      // the index of the shelf names the page relative to the shelf, also inside a folder of it
      const [shelf = '', ...rest] = normalize(page).split('/')
      const index = join(this.dir, shelf, INDEX)
      if (existsSync(index)) writeFileSync(index, removeRows(readFileSync(index, 'utf8'), [rest.join('/')]))
      done.push(`${page} → ${relative(this.home, to)}`)
    }
    const names = new Set(pages.map(page => basename(page, '.md')))
    const files = new Set(pages.map(page => normalize(page)))
    for (const page of markdownIn(this.dir)) {
      const file = join(this.dir, page)
      const text = readFileSync(file, 'utf8')
      const linked = text
        .replace(/\[\[([^\]|#]+)((?:[|#][^\]]*)?)\]\]/g, (all, name: string, rest: string) => (names.has(name.trim()) ? `[[${basename(into, '.md')}${rest}]]` : all))
        .replace(/\]\(([^)\s]+\.md)\)/g, (all, target: string) =>
          files.has(normalize(join(dirname(page), target))) ? `](${relative(dirname(page), into) || basename(into)})` : all,
        )
      if (linked !== text) {
        writeFileSync(file, linked)
        done.push(`${page}: links point at ${into}`)
      }
    }
    return done
  }

  private lineFor(shelf: Shelf, page: string): IndexLine {
    const text = readFileSync(join(this.dir, shelf.name, page), 'utf8')
    const type = /^---\n[\s\S]*?^type:\s*(.+)$[\s\S]*?^---$/m.exec(text)?.[1]?.trim()
    return { page, type: type ?? SHELF_TYPES[shelf.name] ?? 'page', summary: summaryOf(text) }
  }
}

const gap = (text: string, fix: string): Finding => ({ level: 'warn', where: 'wiki', text, fix })

const title = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

const shelfRow = (shelf: Shelf) => (shelf.index ? `| [${shelf.name}](${shelf.name}/${INDEX}) | ${shelf.use} |` : `| ${shelf.name} | ${shelf.use} |`)

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const firstSentence = (text: string) => capital(/^(.+?[.!?])(?:\s|$)/.exec(text.trim())?.[1] ?? text.trim().slice(0, 120))

/** The first sentence of the In short line, or of the first paragraph. */
function summaryOf(text: string): string {
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
  const short = /^>\s*In short:\s*(.+)$/im.exec(body)?.[1]
  if (short) return firstSentence(short)
  const paragraph = body.split('\n').find(line => line.trim() && !/^(#|>|\||[-*]\s|```)/.test(line.trim()))
  return paragraph ? firstSentence(paragraph) : ''
}

/** The Markdown files under a folder, relative to it, with no hidden file. */
function markdownIn(dir: string): string[] {
  const found: string[] = []
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(folder, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name.endsWith('.md')) found.push(normalize(relative(dir, path)))
    }
  }
  if (existsSync(dir)) walk(dir)
  return found.sort()
}
