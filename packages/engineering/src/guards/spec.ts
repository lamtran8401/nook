import type { Gap, Guard, GuardContext } from './guard.ts'

/** agree: spec.md parses, names criteria (or questions for an investigation), and names areas of nook.yml. */
export class SpecParses implements Guard {
  check(ctx: GuardContext): Gap[] {
    const spec = ctx.spec()
    if (!spec) return [{ text: 'spec.md is missing', fix: `nook eng item start ${ctx.id} scaffolds it` }]
    const file = ctx.folder.path('spec.md')
    const found: Gap[] = spec.problems.map(p => ({ text: `spec.md: ${p}`, fix: `edit ${file}` }))
    const kind = spec.kind ?? ctx.item.kind
    if (kind === 'investigate' && !spec.questions.length) {
      found.push({
        text: 'spec.md: an investigate item needs at least one question under ## Questions',
        fix: `edit ${file}`,
      })
    }
    if (kind !== 'investigate' && !spec.criteria.length) {
      found.push({
        text: 'spec.md: no acceptance criterion',
        fix: `add a \`- [ADD] text\` line under ## Acceptance criteria in ${file}`,
      })
    }
    for (const area of spec.areas.filter(a => !ctx.home.config.area(a))) {
      found.push({
        text: `spec.md: area "${area}" is not in nook.yml`,
        fix: `fix the name in ${file}, or add the area with /setup`,
      })
    }
    return found
  }
}
