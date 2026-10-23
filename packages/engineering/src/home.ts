import { existsSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

import { featureHome, STATE_DIR } from '@nook/workspace/workspaces.ts'
import { EvError, Exit, refused } from '@nook/shared/errors.ts'

import { type Area, EngineeringConfig } from './config.ts'

/** The nearest workspace above a folder that turns `engineering` on, with its config and its paths. */
export class Home {
  constructor(
    readonly dir: string,
    readonly config: EngineeringConfig,
  ) {}

  static find(cwd = process.cwd()): Home | null {
    const home = featureHome('engineering', cwd)
    return home ? new Home(home.dir, EngineeringConfig.read(home.dir)) : null
  }

  static require(cwd = process.cwd()): Home {
    const home = Home.find(cwd)
    if (home) return home
    throw new EvError(
      'not inside a workspace that turns engineering on',
      Exit.error,
      'run `nook init --with engineering` in the folder of the project, or add an `engineering:` section to its nook.yml',
    )
  }

  get workRoot(): string {
    return join(this.dir, this.config.dir)
  }

  get backlogRoot(): string {
    return join(this.dir, this.config.backlog)
  }

  get adrDir(): string {
    return join(this.dir, 'docs', 'adr')
  }

  get dbFile(): string {
    return join(this.dir, STATE_DIR, 'engineering.db')
  }

  get stateDir(): string {
    return join(this.dir, STATE_DIR)
  }

  workDir(id: string): string {
    return join(this.workRoot, id)
  }

  backlogDir(id: string): string {
    return join(this.backlogRoot, id)
  }

  areaDir(area: Area): string {
    return resolve(this.dir, area.path)
  }

  areaNamed(name: string): Area {
    const area = this.config.area(name)
    if (area) return area
    if (this.config.missing)
      throw refused(
        `nook.yml has no engineering section, so there is no area ${name}`,
        'add areas to nook.yml with /setup',
      )
    const known = this.config.areas.map(a => a.name).join(', ') || 'none'
    throw refused(`area ${name} is not in nook.yml`, `areas that exist: ${known}; add it with /setup`)
  }

  /** The area whose folder holds `file`, the deepest first. */
  areaOf(file: string): Area | undefined {
    const full = resolve(file)
    return this.config.areas
      .map(area => ({ area, dir: this.areaDir(area) }))
      .filter(({ dir }) => full === dir || full.startsWith(`${dir}/`))
      .sort((a, b) => b.dir.length - a.dir.length)[0]?.area
  }

  /** A recorded file (from the home, from the area, or absolute) as a path relative to the area folder. */
  fileInArea(area: Area, file: string): string {
    const dir = this.areaDir(area)
    const candidates = (isAbsolute(file) ? [file] : [resolve(dir, file), resolve(this.dir, file)]).filter(
      c => !relative(dir, c).startsWith('..'),
    )
    const inside = candidates.find(c => existsSync(c)) ?? candidates[0]
    if (!inside) throw refused(`file ${file} is outside area ${area.name}`, 'record files of the area only')
    return relative(dir, inside)
  }
}
