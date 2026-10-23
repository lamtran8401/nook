import { parseRootCause } from '../documents/root-cause.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** submit, for a flow that asks for a root cause: root-cause.md names a type of the workspace and holds the analysis. */
export class RootCauseWritten implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (!ctx.flow.submit.includes('root-cause')) return []
    const path = ctx.folder.path('root-cause.md')
    const text = ctx.folder.read('root-cause.md')
    if (text === null) return [{ text: 'root-cause.md is missing', fix: `write ${path}: front matter type, then the analysis in a few lines under it` }]
    const cause = parseRootCause(text)
    const { rootCauses, unknownRootCause } = ctx.home.config
    const found: Gap[] = []
    if (!cause.type)
      found.push({ text: 'root-cause.md: the type is missing', fix: rootCauses.length ? `pick one type for ${path}: ${rootCauses.join(', ')}` : `write type: <why the bug was made> in ${path}` })
    else if (rootCauses.length && !rootCauses.includes(cause.type))
      found.push({ text: `root-cause.md: the type "${cause.type}" is not in engineering.rootCauses: ${rootCauses.join(', ')}`, fix: `pick one type for ${path}` })
    else if (cause.type === unknownRootCause && !cause.reason)
      found.push({ text: `root-cause.md: the type ${cause.type} needs a reason in the front matter`, fix: `write reason: <why the cause is not known yet> in ${path}` })
    if (!cause.analysis.length) found.push({ text: 'root-cause.md: the analysis is missing', fix: `write the analysis in a few lines under the title of ${path}` })
    return found
  }
}
