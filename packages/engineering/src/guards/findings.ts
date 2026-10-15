import { answeredQuestions } from '../documents/findings.ts'
import { isFilled } from '../documents/markdown.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** The guards of an investigation, which answers questions in findings.md in place of slices and criteria. */

/** submit: findings.md holds text. */
export class FindingsFilled implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (!ctx.investigates) return []
    const text = ctx.folder.read('findings.md')
    if (text && isFilled(text)) return []
    return [
      {
        text: 'findings.md is not filled',
        fix: `write ## Q<n> with Answer, Evidence, Open in ${ctx.folder.path('findings.md')}`,
      },
    ]
  }
}

/** accept: each question of the spec has an Answer and an Evidence in findings.md. */
export class QuestionsAnswered implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (!ctx.investigates) return []
    const questions = ctx.spec()?.questions ?? []
    const answered = answeredQuestions(ctx.folder.read('findings.md') ?? '')
    return questions
      .map((text, i) => ({ n: i + 1, text }))
      .filter(q => !answered.has(q.n))
      .map(q => ({
        text: `Q${q.n} has no answer with evidence in findings.md: ${q.text}`,
        fix: `write ## Q${q.n} with Answer and Evidence in ${ctx.folder.path('findings.md')}`,
      }))
  }
}
