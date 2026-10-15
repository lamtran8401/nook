import { emptySections, isFilled } from '../documents/markdown.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

const PLAN_SECTIONS = ['Architecture', 'Design', 'Steps', 'Tests', 'Risks']

/** approve: plan.md is more than the template, and each of its sections holds text. */
export class PlanFilled implements Guard {
  check(ctx: GuardContext): Gap[] {
    const file = ctx.folder.path('plan.md')
    const text = ctx.folder.read('plan.md')
    if (text === null) return [{ text: 'plan.md is missing', fix: `write ${file}` }]
    if (!isFilled(text))
      return [{ text: 'plan.md is the template, not a plan', fix: `write the sections of ${file}` }]
    return emptySections(text, PLAN_SECTIONS).map(name => ({
      text: `plan.md: ## ${name} is empty`,
      fix: `write it in ${file}`,
    }))
  }
}
