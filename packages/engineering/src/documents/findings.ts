import { sections } from './markdown.ts'

/** `works/<id>/findings.md`: the questions with an Answer and an Evidence line under `## Q<n>`. */
export function answeredQuestions(text: string): Set<number> {
  const answered = new Set<number>()
  for (const [name, lines] of sections(text)) {
    const question = /^q(\d+)\b/.exec(name)
    if (!question) continue
    const has = (label: string) =>
      lines.some(l => new RegExp(`^\\s*(?:[-*]\\s*)?\\**${label}\\**\\s*:\\s*\\S`, 'i').test(l))
    if (has('answer') && has('evidence')) answered.add(Number(question[1]))
  }
  return answered
}
