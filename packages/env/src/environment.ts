import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { KitConfig } from './kit-config.ts'

export const KIT_FILE = 'kit.yml'
export const STATE_DIR = '.kit'

/** A folder with a `kit.yml`: its packs and rules reach every folder inside it. */
export class Environment {
  constructor(
    readonly dir: string,
    readonly config: KitConfig,
  ) {}

  static read(dir: string): Environment {
    const file = join(dir, KIT_FILE)
    return new Environment(dir, KitConfig.parse(readFileSync(file, 'utf8'), file))
  }

  /** Every environment from the root down to `from`: the outermost first. */
  static above(from = process.cwd()): Environment[] {
    const found: Environment[] = []
    for (let dir = resolve(from); ; dir = dirname(dir)) {
      if (existsSync(join(dir, KIT_FILE))) found.push(Environment.read(dir))
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
