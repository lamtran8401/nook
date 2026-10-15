import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError } from '@kit/shared/errors.ts'
import { projectRoot } from './env.ts'

/** `pack.json`: what a pack tells the core. The folder of a pack is a Claude Code plugin (skills, agents, hooks, templates). */
export type PackManifest = {
  name: string
  description: string
  /** Rules that `kit init` copies into `.claude/rules/kit/`, relative to the pack folder. */
  rules?: string[]
  /** A settings fragment that `kit init` merges into `.claude/settings.json`. */
  settings?: string
  /** Folders that the pack keeps under the state folder. */
  state?: string[]
}

export function readManifest(dir: string): PackManifest {
  const file = join(dir, 'pack.json')
  if (!existsSync(file)) throw new EvError(`${file} is missing`)
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as PackManifest
  if (!manifest.name) throw new EvError(`${file} needs a name`)
  return manifest
}

/** Every pack that the kit project ships, by name: the folders of `plugins/`. */
export function availablePacks(): Map<string, { dir: string; manifest: PackManifest }> {
  const packsDir = join(projectRoot(), 'plugins')
  const found = new Map<string, { dir: string; manifest: PackManifest }>()
  if (!existsSync(packsDir)) return found
  for (const entry of readdirSync(packsDir, { withFileTypes: true })) {
    const dir = join(packsDir, entry.name)
    if (!entry.isDirectory() || !existsSync(join(dir, 'pack.json'))) continue
    const manifest = readManifest(dir)
    found.set(manifest.name, { dir, manifest })
  }
  return found
}

/** The plugin folder of one pack: its skills, agents, hooks and templates. */
export function pluginDir(name: string): string {
  const pack = availablePacks().get(name)
  if (!pack) throw new EvError(`the kit project has no plugin for the pack ${name}`)
  return pack.dir
}
