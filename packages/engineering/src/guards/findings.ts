import { answeredQuestions } from '../documents/findings.ts'
import { body, isFilled, sections } from '../documents/markdown.ts'
import type { Gap, Guard, GuardContext } from './guard.ts'

/** The guards of a flow whose submit asks for findings: it answers questions in findings.md in place of slices and criteria. */

const RESULTS = 'a decision or a document, a proof of concept, new tickets, a session, a wiki page'

/** submit: findings.md holds text, and a ## Results part that names what the work left. */
export class FindingsFilled implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (!ctx.flow.submit.includes('findings')) return []
    const file = ctx.folder.path('findings.md')
    const text = ctx.folder.read('findings.md')
    if (!text || !isFilled(text)) return [{ text: 'findings.md is not filled', fix: `write ## Q<n> with Answer, Evidence, Open in ${file}` }]
    if (body(sections(text).get('results')).length) return []
    return [{ text: `findings.md has no ## Results: name what the work left: ${RESULTS}`, fix: `write ## Results with one line for each result in ${file}` }]
  }
}

/** accept: each question of the spec has an Answer and an Evidence in findings.md. */
export class QuestionsAnswered implements Guard {
  check(ctx: GuardContext): Gap[] {
    if (!ctx.flow.submit.includes('findings')) return []
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
