import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** The folders that the owner made desks with `nook init`, one path on each line of a file in the home. */
export class DeskList {
  // a plain field, not a parameter property: the web server imports this file under Node, which strips types only
  readonly file: string

  constructor(file: string) {
    this.file = file
  }

  static pathFor(env: Record<string, string | undefined> = process.env): string {
    const config = env.XDG_CONFIG_HOME || join(env.HOME || homedir(), '.config')
    return join(config, 'nook', 'desks')
  }

  /** The list of the owner. */
  static mine(env: Record<string, string | undefined> = process.env): DeskList {
    return new DeskList(DeskList.pathFor(env))
  }

  add(dir: string): void {
    const dirs = this.read()
    if (dirs.includes(dir)) return
    this.write([...dirs, dir])
  }

  /** The folders that still exist; a folder that is gone drops off the file. */
  dirs(): string[] {
    const dirs = this.read()
    const live = dirs.filter(dir => existsSync(dir))
    if (live.length !== dirs.length) this.write(live)
    return live
  }

  private read(): string[] {
    if (!existsSync(this.file)) return []
    const lines = readFileSync(this.file, 'utf8').split('\n').map(line => line.trim()).filter(Boolean)
    return [...new Set(lines)]
  }

  private write(dirs: string[]): void {
    mkdirSync(dirname(this.file), { recursive: true })
    writeFileSync(this.file, dirs.map(dir => `${dir}\n`).join(''))
  }
}
