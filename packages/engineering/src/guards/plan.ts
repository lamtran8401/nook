import { emptySections, isFilled } from '../documents/markdown.ts'
import type { Size } from '../vocabulary.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

const PLAN_SECTIONS = ['Today', 'Approach', 'Impact', 'Proof', 'Risks']

/** The sections that a plan of this size must fill: a plan of size L also needs the Flow. */
export const planSections = (size: Size) => (size === 'L' ? [...PLAN_SECTIONS, 'Flow'] : PLAN_SECTIONS)

/** approve: plan.md is more than the template, and each of its sections holds text or a diagram. */
export class PlanFilled implements Guard {
  check(ctx: GuardContext): Gap[] {
    const file = ctx.folder.path('plan.md')
    const text = ctx.folder.read('plan.md')
    const wanted = planSections(ctx.item.size)
    if (text === null) return [{ text: 'plan.md is missing', fix: `write ${file}` }]
    if (!isFilled(text))
      return [
        {
          text: 'plan.md is the template, not a plan',
          fix: `write the sections ${wanted.join(', ')} of ${file}`,
        },
      ]
    return emptySections(text, wanted).map(name => ({
      text: `plan.md: ## ${name} is empty`,
      fix: `write the ${name} in ${file}`,
    }))
  }
}
