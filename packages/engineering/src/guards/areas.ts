import type { Area } from '../config.ts'
import { GitRepo } from '../git/repo.ts'
import type { AreaGuard, Gap, Guard, GuardContext } from './guard.ts'

/** Runs area guards on each area of the item in turn, so the gaps of one area stay together. */
export class EachArea implements Guard {
  private readonly guards: AreaGuard[]

  constructor(...guards: AreaGuard[]) {
    this.guards = guards
  }

  check(ctx: GuardContext): Gap[] {
    return ctx.item.areas.flatMap(name => {
      const area = ctx.home.config.area(name)
      if (!area) return [{ text: `area ${name} is not in nook.yml`, fix: 'add it with /setup' }]
      return this.guards.flatMap(guard => guard.checkArea(ctx, area))
    })
  }
}

/** begin: a git area is on a branch, and the branch is not protected. */
export class BranchNotProtected implements AreaGuard {
  checkArea(ctx: GuardContext, area: Area): Gap[] {
    const repo = new GitRepo(ctx.home.areaDir(area))
    if (!area.git || !repo.isRepo()) return []
    const branch = repo.branch()
    if (branch && !ctx.home.config.isProtected(branch)) return []
    return [
      {
        text: `area ${area.name} is on ${branch ?? 'no branch'}, a protected branch`,
        fix: `nook eng item branch ${ctx.id}`,
      },
    ]
  }
}

/** begin: no other item in cooking uses the area. */
export class AreaFree implements AreaGuard {
  checkArea(ctx: GuardContext, area: Area): Gap[] {
    const other = ctx.stores.items.cookingIn(area.name, ctx.id)
    if (!other) return []
    return [
      {
        text: `area ${area.name} is in use by ${other.id}`,
        fix: `wait for ${other.id}, or move ${ctx.id} to another area: nook eng item edit ${ctx.id} areas <a>`,
      },
    ]
  }
}
