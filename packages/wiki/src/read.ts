import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { SecretPolicy } from '@nook/desk/secrets.ts'
import { refused } from '@nook/shared/errors.ts'

import { type IndexLine, parseIndex } from './index-file.ts'
import { findWiki } from './module.ts'
import type { PageLink } from './wiki.ts'

/** The read paths of the wiki for the web app: its shelves with their indexes, its drafts, and one page with its links. */

export type ShelfView = { name: string; use: string; lines: IndexLine[] }
export type WikiView = { dir: string; shelves: ShelfView[]; drafts: string[] }
export type PageView = { path: string; text: string; links: PageLink[] }

export function readWiki(desk: string): WikiView | null {
  const wiki = findWiki(desk)
  if (!wiki) return null
  const shelves = wiki.config.shelves.map(shelf => {
    const index = join(wiki.dir, shelf.name, 'INDEX.md')
    return { name: shelf.name, use: shelf.use, lines: existsSync(index) ? parseIndex(readFileSync(index, 'utf8')) : [] }
  })
  return { dir: wiki.dir, shelves, drafts: wiki.drafts() }
}

/** One Markdown page or draft of the wiki, by its path in the wiki; a path outside it, or a secret, is refused. */
export function readPage(desk: string, path: string): PageView {
  const wiki = findWiki(desk)
  if (!wiki) throw refused('this desk has no wiki', 'add `wiki` to `packs:` in nook.yml, then run /setup')
  const full = resolve(wiki.dir, path)
  const inside = relative(wiki.dir, full)
  if (inside.startsWith('..') || !inside.endsWith('.md') || new SecretPolicy(desk).isSecretPath(full) || !existsSync(full))
    throw refused(`${path} is no page of the wiki`, 'open a page from a shelf index')
  return { path: inside, text: readFileSync(full, 'utf8'), links: wiki.links(inside) }
}
