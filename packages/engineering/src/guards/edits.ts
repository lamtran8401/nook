import type { Gap, Guard, GuardContext } from './guard.ts'

/** The files of an area that changed with no running slice, once each, as the `file` events of the item recorded them. */
export class EditsOutsideSlices implements Guard {
  check(ctx: GuardContext): Gap[] {
    const files = [...new Set(ctx.stores.events.history(ctx.id).filter(e => e.type === 'file' && e.reason).map(e => e.reason!))]
    if (!files.length) return []
    return [{ text: `${files.length} file${files.length > 1 ? 's' : ''} changed outside a slice: ${files.join(', ')}`, fix: 'read their diff before your accept' }]
  }
}
