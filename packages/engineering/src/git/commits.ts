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

type Ready = { slice: Slice; area: string; repo: GitRepo; files: string[] }

/** `done` holds the done slices in the order that they finished, the oldest first. */
export function planCommits(home: Home, id: string, done: Slice[]): CommitPlan {
  const plan: CommitPlan = { entries: [], skipped: [] }
  const ready: Ready[] = []
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
    ready.push({ slice, area: area.name, repo, files: slice.files.map(f => home.fileInArea(area, f)) })
  }
  const owned = ownChangedFiles(ready)
  for (const r of ready) {
    const files = owned.get(r)!
    if (!files.length) {
      plan.skipped.push(`${r.slice.id}: nothing changed since its last commit`)
      continue
    }
    plan.entries.push({
      slice: r.slice.id,
      area: r.area,
      dir: r.repo.dir,
      branch: r.repo.branch(),
      files,
      message: `${id} ${r.slice.id}: ${r.slice.title}`,
    })
  }
  return plan
}

/** A file that changed since the last commit belongs to the slice that touched it last, so no commit takes the work of another slice. */
function ownChangedFiles(ready: Ready[]): Map<Ready, string[]> {
  const left = new Map<string, Set<string>>()
  const owned = new Map<Ready, string[]>()
  for (const r of [...ready].reverse()) {
    const changed = left.get(r.repo.dir) ?? new Set(r.repo.changedSince('HEAD'))
    left.set(r.repo.dir, changed)
    const mine = r.files.filter(f => changed.has(f))
    for (const f of mine) changed.delete(f)
    owned.set(r, mine)
  }
  return owned
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
