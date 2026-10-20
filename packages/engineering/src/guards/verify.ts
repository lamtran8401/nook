import { match } from 'ts-pattern'

import type { Gap, Guard, GuardContext } from './guard.ts'

/** `slices`: submit needs a passing verify after the last move back; `quick`: so does a quick accept. */
export type VerifyScope = 'slices' | 'quick'

export class VerifyPassed implements Guard {
  constructor(private readonly scope: VerifyScope) {}

  check(ctx: GuardContext): Gap[] {
    if (ctx.flow.slices === 'none' || !this.applies(ctx) || ctx.stores.checks.verifiedAt(ctx.item)) return []
    const text = match(this.scope)
      .with('slices', () => 'the checks have not passed since the last move back')
      .with('quick', () => 'the checks have not passed')
      .exhaustive()
    return [{ text, fix: `nook eng item verify ${ctx.id}` }]
  }

  private applies(ctx: GuardContext): boolean {
    return match(this.scope)
      .with('slices', () => true)
      .with('quick', () => ctx.item.quick)
      .exhaustive()
  }
}
