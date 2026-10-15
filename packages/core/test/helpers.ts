import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type InitReport, init } from '../src/init/initializer.ts'

export const CORE_DIR = join(import.meta.dir, '..', '..', '..', 'plugins', 'core')

export const tempDir = (prefix = 'kit-'): string => realpathSync(mkdtempSync(join(tmpdir(), prefix)))
export const removeDir = (dir: string): void => rmSync(dir, { recursive: true, force: true })

export const initIn = (dir: string, packs: string[] = [], update = false): InitReport =>
  init({ dir, packs, update, coreDir: CORE_DIR })

/** A user folder of Claude Code with these plugin ids turned on, so a test never reads `~/.claude`. */
export function claudeDirWith(root: string, ids: string[]): string {
  const dir = join(root, '.claude-user')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabledPlugins: Object.fromEntries(ids.map(id => [id, true])) }))
  return dir
}
