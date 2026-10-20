import { isOpen } from '../machine.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** accept: no child of the item is open; a done or cancelled child, or one taken out with detach, passes. */
export class ChildrenDone implements Guard {
  check(ctx: GuardContext): Gap[] {
    return ctx.stores.items
      .children(ctx.id)
      .filter(child => isOpen(child.state))
      .map(child => ({
        text: `${child.id} is ${child.state}: a sub-item of ${ctx.id} is open`,
        fix: `finish ${child.id}, or nook eng item detach ${child.id} --reason "<why>"`,
      }))
  }
}
