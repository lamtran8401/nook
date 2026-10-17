import { ownerStep } from '../owner-step.ts'
import type { Stores } from '../stores/index.ts'
import type { Item } from '../stores/items.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** The item is in mode yolo, and the owner made the last mode change. */
export function ownerStartedAuto(stores: Stores, item: Item): boolean {
  return item.mode === 'yolo' && stores.events.last(item.id, 'mode')?.role === 'owner'
}

/** proceed: only a yolo run that the owner started passes the approve gate. */
export class AutoByOwner implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (ownerStartedAuto(ctx.stores, ctx.item)) return []
    return [
      {
        text: `${ctx.id} is not in a yolo run that the owner started (mode ${ctx.item.mode})`,
        fix: `${ownerStep(`mode ${ctx.id} yolo`)}, or ${ownerStep(`approve ${ctx.id}`)}`,
      },
    ]
  }
}
