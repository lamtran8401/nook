import { SpecDocument } from '../documents/spec.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** accept: every criterion is marked, and each mark was made for the text that the spec holds now. */
export class CriteriaMarked implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (ctx.investigates) return []
    const id = ctx.id
    const marks = ctx.stores.criteria.list(id)
    const found: Gap[] = []
    if (!marks.length)
      found.push({ text: 'no acceptance criterion', fix: `kit eng item ac add ${id} "<text>" --tag ADD` })
    for (const c of marks.filter(c => !c.done)) {
      found.push({
        text: `AC ${c.n} is not met: ${c.text}`,
        fix: `kit eng item ac done ${id} ${c.n} --evidence "<what shows it>" --grade run|sourced|judged|owner`,
      })
    }
    const text = ctx.folder.read('spec.md')
    if (!text) return found
    const lines = SpecDocument.parse(text).criteria
    if (lines.length !== marks.length)
      found.push({
        text: `spec.md has ${lines.length} criteria, the ledger has ${marks.length}`,
        fix: `kit eng item replan ${id}`,
      })
    for (const c of marks.filter(c => c.done)) {
      const line = lines[c.n - 1]
      if (!line || line.text === c.text) continue
      found.push({
        text: `AC ${c.n} was marked for another text: "${c.text}" is now "${line.text}"`,
        fix: `kit eng item ac undo ${id} ${c.n}, then ac done with new evidence`,
      })
    }
    return found
  }
}
