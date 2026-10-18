import { CRITERION_TAG } from '../lib/rules.ts'

/** The tone of the badge of each item state, as the Bench badges read it. */
export const STATE_TONE: Record<string, string> = {
  backlog: 'neutral',
  framing: 'primary',
  planning: 'primary',
  ready: 'primary',
  cooking: 'primary',
  review: 'warning',
  blocked: 'danger',
  done: 'success',
  cancelled: 'neutral',
}

/** The tone of the tag of a criterion, such as [ADD]. */
export const CRITERION_TONE: Record<string, string> = { ADD: 'success', CHANGE: 'primary', REMOVE: 'danger', NONE: 'neutral' }

/** The tag of a criterion and the words after it: the ledger keeps `[ADD] the export has the right date`. */
export function criterionTag(text: string): { tag: string; words: string } {
  const found = CRITERION_TAG.exec(text)
  return found ? { tag: found[1]!, words: text.slice(found[0].length) } : { tag: '', words: text }
}
