import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { EvError } from '@kit/shared/errors.ts'

import { projectRoot } from './project.ts'

/** `pack.json`: what a pack tells the core. The folder of a pack is a Claude Code plugin (skills, agents, hooks, templates). */
export type PackManifest = {
  name: string
  description: string
  /** Rules that `kit init` copies into `.claude/rules/kit/`, relative to the pack folder. */
  rules?: string[]
  /** A settings fragment that `kit init` merges into `.claude/settings.json`. */
  settings?: string
  /** Files and folders that the pack keeps under the state folder. */
  state?: string[]
}

export type Plugin = { dir: string; manifest: PackManifest }

export function readManifest(dir: string): PackManifest {
  const file = join(dir, 'pack.json')
  if (!existsSync(file)) throw new EvError(`${file} is missing`)
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as PackManifest
  if (!manifest.name) throw new EvError(`${file} needs a name`)
  return manifest
}

/** The packs that the kit project ships: one plugin folder each under `plugins/`. */
export class Catalog {
  private constructor(private readonly plugins: Map<string, Plugin>) {}

  static load(root = projectRoot()): Catalog {
    const dir = join(root, 'plugins')
    const plugins = new Map<string, Plugin>()
    if (!existsSync(dir)) return new Catalog(plugins)
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const pluginDir = join(dir, entry.name)
      if (!entry.isDirectory() || !existsSync(join(pluginDir, 'pack.json'))) continue
      const manifest = readManifest(pluginDir)
      plugins.set(manifest.name, { dir: pluginDir, manifest })
    }
    return new Catalog(plugins)
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  has(name: string): boolean {
    return this.plugins.has(name)
  }

  all(): Plugin[] {
    return [...this.plugins.values()]
  }

  dirOf(name: string): string {
    const plugin = this.get(name)
    if (!plugin) throw new EvError(`the kit project has no plugin for the pack ${name}`)
    return plugin.dir
  }
}
