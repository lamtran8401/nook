import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { STATE_DIR } from '@nook/shared/names.ts'

import { NookConfig } from './nook-config.ts'

export { STATE_DIR }
export const NOOK_FILE = 'nook.yml'

/** A folder with a `nook.yml`: its features and rules reach every folder inside it. */
export class Desk {
  constructor(
    readonly dir: string,
    readonly config: NookConfig,
  ) {}

  static read(dir: string): Desk {
    const file = join(dir, NOOK_FILE)
    return new Desk(dir, NookConfig.parse(readFileSync(file, 'utf8'), file))
  }

  /** Every desk from the root down to `from`: the outermost first. */
  static above(from = process.cwd()): Desk[] {
    const found: Desk[] = []
    for (let dir = resolve(from); ; dir = dirname(dir)) {
      if (existsSync(join(dir, NOOK_FILE))) found.push(Desk.read(dir))
      if (dirname(dir) === dir) break
    }
    return found.reverse()
  }

  static nearest(from = process.cwd()): Desk | null {
    return Desk.above(from).at(-1) ?? null
  }

  secretFiles(): string[] {
    return this.config.secrets.map(secret => resolve(this.dir, secret))
  }
}
