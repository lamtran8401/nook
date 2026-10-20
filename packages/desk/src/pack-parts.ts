import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { Catalog } from './catalog.ts'
import { activePacks } from './packs.ts'

/** One agent or skill of a pack, as the web app shows it: its pack, its name and its job in one sentence. */
export type PackPart = { kind: 'agent' | 'skill'; pack: string; name: string; job: string }

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---/

/** The name and the first sentence of the description in the front matter of a file; null when it has none. */
function partOf(file: string): { name: string; job: string } | null {
  const found = FRONT.exec(readFileSync(file, 'utf8'))
  const front = found ? (parse(found[1]!) as { name?: unknown; description?: unknown } | null) : null
  if (typeof front?.name !== 'string') return null
  const description = typeof front.description === 'string' ? front.description : ''
  return { name: front.name, job: (/^.*?[.!?](?=\s|$)/.exec(description)?.[0] ?? description).trim() }
}

/** The Markdown files of the entries of a folder: `fileOf` names the file of one entry. */
function partFiles(dir: string, fileOf: (entry: string) => string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .map(entry => join(dir, fileOf(entry)))
    .filter(file => file.endsWith('.md') && existsSync(file))
}

/** The agents and skills of core and of each pack on in `dir`, in the order of the packs. */
export function packParts(dir: string, catalog = Catalog.load()): PackPart[] {
  const packs = ['core', ...activePacks(dir).map(pack => pack.name).filter(name => name !== 'core')]
  return packs.flatMap(pack => {
    const plugin = catalog.get(pack)
    if (!plugin) return []
    const read = (kind: PackPart['kind'], list: string[]): PackPart[] =>
      list.flatMap(file => {
        const part = partOf(file)
        return part ? [{ kind, pack, ...part }] : []
      })
    return [...read('agent', partFiles(join(plugin.dir, 'agents'), entry => entry)), ...read('skill', partFiles(join(plugin.dir, 'skills'), entry => join(entry, 'SKILL.md')))]
  })
}
