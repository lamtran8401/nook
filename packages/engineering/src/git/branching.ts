import { EvError, Exit } from '@kit/shared/errors.ts'

import type { Area } from '../config.ts'
import type { Home } from '../home.ts'
import { GitRepo } from './repo.ts'

/** The branch of an item, `kit/<id>-<slug>`, in each git area of the item. */

export type BranchResult = { area: string; branch: string; made: boolean }

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
export const branchName = (item: { id: string; title: string }) =>
  `kit/${item.id}-${slug(item.title) || 'work'}`

export class Branching {
  constructor(private readonly home: Home) {}

  /** The areas of the item with `git: true` and a repo on disk. */
  gitAreas(areas: string[]): Area[] {
    return areas
      .map(name => this.home.areaNamed(name))
      .filter(area => area.git && new GitRepo(this.home.areaDir(area)).isRepo())
  }

  /** Switches each area to `branch`, and makes the branch where it does not exist. */
  switchAll(areas: Area[], branch: string): BranchResult[] {
    return areas.map(area => this.switchOne(area, branch))
  }

  private switchOne(area: Area, branch: string): BranchResult {
    const repo = new GitRepo(this.home.areaDir(area))
    if (repo.branch() === branch) return { area: area.name, branch, made: false }
    const exists = repo.hasBranch(branch)
    const run = repo.switch(branch, !exists)
    if (!run.ok)
      throw new EvError(
        `area ${area.name}: git switch failed: ${run.err}`,
        Exit.error,
        'commit or stash the changes of the area, then run this again',
      )
    return { area: area.name, branch, made: !exists }
  }
}
