import type { Gap, Guard, GuardContext } from './guard.ts'

const PREFIX = 'outside a slice: '

/** The files of an area that changed with no running slice, once each, as the edit log of the item recorded them. */
export class EditsOutsideSlices implements Guard {
  check(ctx: GuardContext): Gap[] {
    const files = [...new Set(ctx.stores.events.history(ctx.id).filter(e => e.type === 'edit' && e.reason?.startsWith(PREFIX)).map(e => e.reason!.slice(PREFIX.length)))]
    if (!files.length) return []
    return [{ text: `${files.length} file${files.length > 1 ? 's' : ''} changed outside a slice: ${files.join(', ')}`, fix: 'read their diff before your accept' }]
  }
}
