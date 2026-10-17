import type { WorkDoc } from '../documents/work-folder.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

export const APPROVED_DOCS: WorkDoc[] = ['spec.md', 'plan.md', 'tasks.md']

/** The documents in `docs` have the fingerprint of the approve. A quick item has no approve. */
export class FingerprintsUnchanged implements Guard {
  constructor(private readonly docs: WorkDoc[] = APPROVED_DOCS) {}

  check(ctx: GuardContext): Gap[] {
    return this.changed(ctx).map(doc => ({
      text: `${doc} changed after the approve`,
      fix: `nook eng item replan ${ctx.id}`,
    }))
  }

  changed(ctx: GuardContext): WorkDoc[] {
    if (ctx.item.quick) return []
    const approved = ctx.stores.approvals.hashes(ctx.id)
    return this.docs.filter(doc => approved.has(doc) && approved.get(doc) !== ctx.folder.hash(doc))
  }
}
