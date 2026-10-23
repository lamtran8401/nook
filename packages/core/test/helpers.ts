import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type InitReport, init } from '../src/init/initializer.ts'

export const PLUGIN_DIR = join(import.meta.dir, '..', '..', '..', 'plugin')

export const tempDir = (prefix = 'nook-'): string => realpathSync(mkdtempSync(join(tmpdir(), prefix)))
export const removeDir = (dir: string): void => rmSync(dir, { recursive: true, force: true })

export const initIn = (dir: string, features: string[] = [], update = false): InitReport =>
  init({ dir, with: features, update, pluginDir: PLUGIN_DIR })

/** A user folder of Claude Code with these plugin ids turned on, so a test never reads `~/.claude`. */
export function claudeDirWith(root: string, ids: string[]): string {
  const dir = join(root, '.claude-user')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabledPlugins: Object.fromEntries(ids.map(id => [id, true])) }))
  return dir
}
