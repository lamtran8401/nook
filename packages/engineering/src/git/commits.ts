import { EvError, Exit, refused } from '@kit/shared/errors.ts'

import type { EngineeringConfig } from '../config.ts'
import type { Home } from '../home.ts'
import type { Slice } from '../stores/slices.ts'
import { GitRepo } from './repo.ts'

/** One commit for each done slice, from the files that the slice recorded. Never a push. */

export type CommitEntry = {
  slice: string
  area: string
  dir: string
  branch: string | null
  files: string[]
  message: string
  commit?: string
}
export type CommitPlan = { entries: CommitEntry[]; skipped: string[] }

export function planCommits(home: Home, id: string, done: Slice[]): CommitPlan {
  const plan: CommitPlan = { entries: [], skipped: [] }
  for (const slice of done) {
    const area = home.areaNamed(slice.area)
    const repo = new GitRepo(home.areaDir(area))
    if (!area.git || !repo.isRepo()) {
      plan.skipped.push(`${slice.id}: area ${area.name} is not a git area`)
      continue
    }
    if (!slice.files.length) {
      plan.skipped.push(
        `${slice.id} has no files recorded: kit eng task done ${id} ${slice.id} --files <f...>`,
      )
      continue
    }
    const files = slice.files.map(f => home.fileInArea(area, f))
    plan.entries.push({
      slice: slice.id,
      area: area.name,
      dir: repo.dir,
      branch: repo.branch(),
      files,
      message: `${id} ${slice.id}: ${slice.title}`,
    })
  }
  return plan
}

/** Makes the commits and sets the short hash of each entry; first refuses an area on a protected branch. */
export function runCommits(plan: CommitPlan, config: EngineeringConfig, id: string): void {
  for (const entry of plan.entries) {
    if (entry.branch && !config.isProtected(entry.branch)) continue
    throw refused(
      `area ${entry.area} is on ${entry.branch ?? 'no branch'}: a commit goes on the item branch, not a protected one`,
      `kit eng item branch ${id}`,
    )
  }
  for (const entry of plan.entries) {
    const repo = new GitRepo(entry.dir)
    const add = repo.add(entry.files)
    if (!add.ok) throw new EvError(`${entry.slice}: git add failed: ${add.err}`)
    const commit = repo.commit(entry.message, entry.files)
    if (!commit.ok)
      throw new EvError(
        `${entry.slice}: git commit failed: ${commit.err || commit.out}`,
        Exit.error,
        'nothing to commit? check git status in the area',
      )
    entry.commit = repo.shortHead()
  }
}
