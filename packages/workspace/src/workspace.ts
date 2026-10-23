import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { STATE_DIR } from '@nook/shared/names.ts'

import { NookConfig } from './nook-config.ts'

export { STATE_DIR }
export const NOOK_FILE = 'nook.yml'

/** A folder with a `nook.yml`: its features and rules reach every folder inside it. */
export class Workspace {
  constructor(
    readonly dir: string,
    readonly config: NookConfig,
  ) {}

  static read(dir: string): Workspace {
    const file = join(dir, NOOK_FILE)
    return new Workspace(dir, NookConfig.parse(readFileSync(file, 'utf8'), file))
  }

  /** Every workspace from the root down to `from`: the outermost first. */
  static above(from = process.cwd()): Workspace[] {
    const found: Workspace[] = []
    for (let dir = resolve(from); ; dir = dirname(dir)) {
      if (existsSync(join(dir, NOOK_FILE))) found.push(Workspace.read(dir))
      if (dirname(dir) === dir) break
    }
    return found.reverse()
  }

  static nearest(from = process.cwd()): Workspace | null {
    return Workspace.above(from).at(-1) ?? null
  }

  secretFiles(): string[] {
    return this.config.secrets.map(secret => resolve(this.dir, secret))
  }
}
