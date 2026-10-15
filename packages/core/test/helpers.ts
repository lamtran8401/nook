import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type InitReport, init } from '../src/init/initializer.ts'

export const CORE_DIR = join(import.meta.dir, '..', '..', '..', 'plugins', 'core')

export const tempDir = (prefix = 'kit-'): string => realpathSync(mkdtempSync(join(tmpdir(), prefix)))
export const removeDir = (dir: string): void => rmSync(dir, { recursive: true, force: true })

export const initIn = (dir: string, packs: string[] = [], update = false): InitReport =>
  init({ dir, packs, update, coreDir: CORE_DIR })
