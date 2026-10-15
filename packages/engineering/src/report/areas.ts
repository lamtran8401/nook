import { existsSync } from 'node:fs'

import { GitRepo } from '../git/repo.ts'
import type { Engineering } from '../service.ts'

/** `area status`: the folder, the kind, the branch, the dirty files and the item that uses each area. */

export type AreaStatus = {
  area: string
  path: string
  kind: string
  exists: boolean
  branch: string | null
  dirty: number
  item: string | null
}

export function areaStatus(eng: Engineering): AreaStatus[] {
  const cooking = eng.stores.items.list('cooking')
  return eng.home.config.areas.map(area => {
    const dir = eng.home.areaDir(area)
    const repo = new GitRepo(dir)
    const isRepo = area.git && repo.isRepo()
    return {
      area: area.name,
      path: area.path,
      kind: area.kind,
      exists: existsSync(dir),
      branch: isRepo ? repo.branch() : null,
      dirty: isRepo ? repo.dirtyFiles().length : 0,
      item: cooking.find(i => i.areas.includes(area.name))?.id ?? null,
    }
  })
}
