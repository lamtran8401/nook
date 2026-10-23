import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

import { SecretPolicy } from '@nook/workspace/secrets.ts'
import { refused } from '@nook/shared/errors.ts'

import { type IndexLine, parseIndex } from './index-file.ts'
import { findWiki } from './module.ts'
import type { PageLink } from './wiki.ts'

/** The read paths of the wiki for the web app: its shelves with their indexes, its drafts, and one page with its links. */

export type ShelfView = { name: string; use: string; lines: IndexLine[] }
export type WikiView = { dir: string; shelves: ShelfView[]; drafts: string[] }
export type PageView = { path: string; text: string; links: PageLink[] }

export function readWiki(workspace: string): WikiView | null {
  const wiki = findWiki(workspace)
  if (!wiki) return null
  const shelves = wiki.config.shelves.map(shelf => {
    const index = join(wiki.dir, shelf.name, 'INDEX.md')
    return { name: shelf.name, use: shelf.use, lines: existsSync(index) ? parseIndex(readFileSync(index, 'utf8')) : [] }
  })
  return { dir: wiki.dir, shelves, drafts: wiki.drafts() }
}

/**
 * One Markdown page or draft of the wiki, by its path in the wiki. The checks run on the real path, after each link,
 * so a page that links to a file outside the wiki or to a secret is refused like the file itself.
 */
export function readPage(workspace: string, path: string): PageView {
  const wiki = findWiki(workspace)
  if (!wiki) throw refused('this workspace has no wiki', 'add `wiki:` to nook.yml, then run /setup')
  const full = resolve(wiki.dir, path)
  const inside = relative(wiki.dir, full)
  if (!isPage(wiki.dir, full, inside, new SecretPolicy(workspace))) throw refused(`${path} is no page of the wiki`, 'open a page from a shelf index')
  return { path: inside, text: readFileSync(full, 'utf8'), links: wiki.links(inside) }
}

function isPage(root: string, full: string, inside: string, secrets: SecretPolicy): boolean {
  if (!within(root, full) || !inside.endsWith('.md') || !existsSync(full)) return false
  const real = realpathSync(full)
  return within(realpathSync(root), real) && statSync(real).isFile() && !secrets.isSecretPath(full) && !secrets.isSecretPath(real)
}

const within = (root: string, path: string): boolean => {
  const rel = relative(root, path)
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}
