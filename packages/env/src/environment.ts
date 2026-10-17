import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { NookConfig } from './nook-config.ts'

export const NOOK_FILE = 'nook.yml'
export const STATE_DIR = '.nook'

/** A folder with a `nook.yml`: its packs and rules reach every folder inside it. */
export class Environment {
  constructor(
    readonly dir: string,
    readonly config: NookConfig,
  ) {}

  static read(dir: string): Environment {
    const file = join(dir, NOOK_FILE)
    return new Environment(dir, NookConfig.parse(readFileSync(file, 'utf8'), file))
  }

  /** Every environment from the root down to `from`: the outermost first. */
  static above(from = process.cwd()): Environment[] {
    const found: Environment[] = []
    for (let dir = resolve(from); ; dir = dirname(dir)) {
      if (existsSync(join(dir, NOOK_FILE))) found.push(Environment.read(dir))
      if (dirname(dir) === dir) break
    }
    return found.reverse()
  }

  static nearest(from = process.cwd()): Environment | null {
    return Environment.above(from).at(-1) ?? null
  }

  secretFiles(): string[] {
    return this.config.secrets.map(secret => resolve(this.dir, secret))
  }
}
