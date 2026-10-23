import type { Event } from '../stores/events.ts'

/** One event of the ledger as a sentence for a person: who did what, the reason, and a tone for its mark. */

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
/** `step` marks a move of the flow, such as the approve; a record, such as a slice moved, is no step. */
export type EventLine = { at: string; title: string; text: string | null; tone: Tone; step: boolean }

const MOVES: Record<string, [string, Tone]> = {
  new: ['added the item', 'neutral'],
  start: ['started the spec', 'neutral'],
  agree: ['agreed the spec', 'primary'],
  approve: ['approved the plan', 'primary'],
  proceed: ['went on with no approve, in yolo mode', 'warning'],
  begin: ['began the build', 'primary'],
  submit: ['sent the item to review', 'primary'],
  accept: ['accepted the item', 'success'],
  reject: ['sent the item back to the build', 'danger'],
  replan: ['opened the plan again', 'warning'],
  reframe: ['opened the spec again', 'warning'],
  reopen: ['opened the done item again', 'warning'],
  block: ['blocked the item', 'danger'],
  unblock: ['unblocked the item', 'primary'],
  cancel: ['cancelled the item', 'neutral'],
  restore: ['brought the item back to the backlog', 'neutral'],
}

const RECORDS: Record<string, string> = {
  verify: 'ran the checks',
  prove: 'proved a slice',
  task: 'moved a slice',
  ac: 'changed a criterion',
  guess: 'recorded a guess',
  question: 'asked or answered a question',
  note: 'wrote a note',
  commit: 'committed the slices',
  branch: 'made the branch',
  mode: 'changed the mode',
  edit: 'edited the item',
  import: 'imported the slices',
  quick: 'made the item quick',
  archive: 'archived the item',
  file: 'changed a file outside a slice',
  agent: 'worked on the item as an agent',
}

const whoOf = (event: Event) => (event.role === 'owner' ? 'You' : event.role === 'lead' ? 'The lead' : event.actor)

/** A verify reason reads `2/3 checks passed`: a success only when every check passed. */
function verifyTone(reason: string | null): Tone {
  const [, passed, total] = /^(\d+)\/(\d+)/.exec(reason ?? '') ?? []
  return passed !== undefined && passed === total ? 'success' : 'danger'
}

export function eventLine(event: Event): EventLine {
  const who = whoOf(event)
  const move = MOVES[event.type]
  if (move) return { at: event.at, title: `${who} ${move[0]}`, text: event.reason, tone: move[1], step: true }
  const record = RECORDS[event.type] ?? `recorded ${event.type}`
  const text = event.type === 'mode' ? `${event.from_state} → ${event.to_state}` : event.reason
  const tone: Tone = event.type === 'verify' ? verifyTone(event.reason) : 'neutral'
  return { at: event.at, title: `${who} ${record}`, text, tone, step: false }
}
