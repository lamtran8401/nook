import { TasksDocument } from '../documents/tasks.ts'
import { cut } from '../format.ts'
import type { Engineering } from '../service.ts'

/** The brief of a slice for a builder: what to build, where, when it is done, the guesses and the decisions it rests on, and the commands to run. */
export function taskBrief(eng: Engineering, id: string, sliceId: string): string {
  const item = eng.item(id)
  const slice = eng.stores.slices.find(id, sliceId)
  if (!slice) return `${id} has no slice ${sliceId}`
  const area = eng.home.config.area(slice.area)
  const acs = eng.stores.criteria.list(id).filter(c => slice.acs.includes(c.n))
  const where = area ? `${eng.home.areaDir(area)} (${area.kind})` : 'not in kit.yml'
  const planned = plannedSlice(eng, id, slice.id)
  const guesses = eng.stores.guesses.list(id, true).filter(g => !g.slices.length || g.slices.includes(slice.id))
  const decisions = eng.stores.adrs.list().filter(a => a.status !== 'superseded' && (a.item === id || a.scope.includes(slice.area)))
  const lines = [
    `${item.id} ${slice.id}: ${slice.title}  [${slice.state}${slice.assignee ? `, ${slice.assignee}` : ''}]`,
    `item: ${cut(item.title, 80)} (${item.kind} ${item.size}, ${item.state})`,
    `area: ${slice.area} → ${where}${area?.test ? `; test: ${area.test}` : ''}${area?.checks?.length ? `; checks: ${area.checks.join(' && ')}` : ''}`,
    slice.depends.length ? `after: ${slice.depends.join(', ')}` : '',
    planned?.files ? `files: ${planned.files}` : '',
    planned?.doneWhen ? `done when: ${planned.doneWhen}` : '',
    acs.length ? `criteria:\n${acs.map(c => `  ${c.n} ${c.text}`).join('\n')}` : 'criteria: none named',
    guesses.length ? `guesses:\n${guesses.map(g => `  ${g.id} (${g.impact}) ${g.question} took ${g.took}, not ${g.other}`).join('\n')}` : '',
    decisions.length ? `decisions:\n${decisions.map(a => `  ADR ${a.n} ${a.title}: ${a.decision}`).join('\n')}` : '',
    slice.files.length ? `files so far: ${slice.files.join(', ')}` : '',
    `proof: ${slice.proof}${slice.proof_note ? ` (${cut(slice.proof_note, 100)})` : ''}`,
    `run: kit eng task start ${id} ${slice.id}; write the failing test first; kit eng task prove ${id} ${slice.id} --files <tests>; ` +
      `kit eng task done ${id} ${slice.id} --files <all files>, or task wait --reason "<what you need>"; after three failed tries: task fail --reason`,
    `record a guess: kit eng guess ${id} "<question>" --took <a> --other <b> --impact low|med|high --slices ${slice.id}`,
  ]
  return lines.filter(Boolean).join('\n')
}

/** The slice as tasks.md writes it, for its `files` and `done when` lines. */
function plannedSlice(eng: Engineering, id: string, sliceId: string) {
  const text = eng.folder(id).read('tasks.md')
  if (text === null) return null
  return TasksDocument.parse(text).slices.find(s => s.id === sliceId) ?? null
}
