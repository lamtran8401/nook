import { dateOf, frontMatter } from '../documents/markdown.ts'
import type { WorkDoc } from '../documents/work-folder.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

const DATE_FIELDS = ['created', 'updated'] as const

/** agree and approve: each document that exists carries `created` and `updated` as `YYYY-MM-DD`. */
export class DatesWritten implements Guard {
  constructor(private readonly docs: WorkDoc[]) {}

  check(ctx: GuardContext): Gap[] {
    return this.docs.flatMap(doc => {
      const text = ctx.folder.read(doc)
      if (text === null) return []
      const front = frontMatter(text)
      return DATE_FIELDS.filter(field => !dateOf(front[field])).map(field => ({
        text: `${doc}: front matter ${field} ${front[field] === undefined ? 'is missing' : 'is not a date'}`,
        fix: `write ${field}: YYYY-MM-DD in the front matter of ${ctx.folder.path(doc)}`,
      }))
    })
  }
}
