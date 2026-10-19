import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { SecretPolicy } from '@nook/desk/secrets.ts'

import { deskPlaces } from '@/lib/places.ts'

/**
 * The search box: a scan of the Markdown files of each pack of the desk, read again at each search, so a page changed
 * a moment ago gives its new words. No index, and no secret file: an env file, a file that nook.yml names, or a link.
 */

export type Hit = { file: string; href: string; heading: string; line: number; text: string }

const LIMIT = 50

/** The Markdown files under a folder; a link is never followed, so it never leads to a file outside. */
function markdownFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => join(entry.parentPath, entry.name))
    .sort()
}

function hitsIn(text: string, words: string[]): { heading: string; line: number; text: string }[] {
  const hits: { heading: string; line: number; text: string }[] = []
  let heading = ''
  text.split('\n').forEach((line, i) => {
    const title = /^#{1,6}\s+(.*)$/.exec(line)
    if (title) heading = title[1]!.trim()
    const lower = line.toLowerCase()
    if (words.every(word => lower.includes(word))) hits.push({ heading, line: i + 1, text: line.trim() })
  })
  return hits
}

/** Each line that holds every word of the query, in the order of the packs and their files, 50 at most. */
export function search(desk: string, query: string): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const secrets = new SecretPolicy(desk)
  return deskPlaces(desk)
    .flatMap(place =>
      markdownFiles(place.root)
        .filter(path => !secrets.isSecretPath(path))
        .flatMap(path => hitsIn(readFileSync(path, 'utf8'), words).map(hit => ({ file: relative(desk, path), href: place.href(relative(place.root, path)), ...hit }))),
    )
    .slice(0, LIMIT)
}
