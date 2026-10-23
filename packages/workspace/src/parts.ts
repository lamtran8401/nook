import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { pluginDir } from './features.ts'

/** One agent or skill of the plugin, as the web app shows it: its name and its job in one sentence. */
export type Part = { kind: 'agent' | 'skill'; name: string; job: string }

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
    .sort()
    .map(entry => join(dir, fileOf(entry)))
    .filter(file => file.endsWith('.md') && existsSync(file))
}

/** The agents, then the skills, of the plugin, each in the order of its name. */
export function parts(dir = pluginDir()): Part[] {
  const read = (kind: Part['kind'], list: string[]): Part[] =>
    list.flatMap(file => {
      const part = partOf(file)
      return part ? [{ kind, ...part }] : []
    })
  return [...read('agent', partFiles(join(dir, 'agents'), entry => entry)), ...read('skill', partFiles(join(dir, 'skills'), entry => join(entry, 'SKILL.md')))]
}
