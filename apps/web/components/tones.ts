import { CRITERION_TAG } from '@/lib/rules.ts'

/** The tone of the badge of each item state, as the Bench badges read it. */
export const STATE_TONE: Record<string, string> = {
  backlog: 'neutral',
  framing: 'violet',
  planning: 'primary',
  ready: 'aqua',
  cooking: 'primary',
  review: 'warning',
  blocked: 'danger',
  done: 'success',
  cancelled: 'neutral',
}

/** The tone of the tag of each type of wiki page. */
export const PAGE_TYPE_TONE: Record<string, string> = { system: 'primary', concept: 'violet', idea: 'warning', source: 'aqua', lesson: 'success', draft: 'warning' }

/** The color of each item kind, the same on every page: feature blue, fix red, investigate violet, chore aqua. */
export const KIND_TONE: Record<string, string> = { feature: 'primary', fix: 'danger', chore: 'aqua', investigate: 'violet' }

const AREA_TONES = ['primary', 'violet', 'aqua', 'warning', 'success', 'ink']

/** One tone for each area of the desk, by its place in `nook.yml`, so an area looks the same on every page. */
export function areaTone(name: string, areas: string[]): string {
  const place = areas.indexOf(name)
  return place < 0 ? 'neutral' : AREA_TONES[place % AREA_TONES.length]!
}

/** The tone of the tag of a criterion, such as [ADD]. */
export const CRITERION_TONE: Record<string, string> = { ADD: 'success', CHANGE: 'primary', REMOVE: 'danger', NONE: 'neutral' }

/** The tag of a criterion and the words after it: the ledger keeps `[ADD] the export has the right date`. */
export function criterionTag(text: string): { tag: string; words: string } {
  const found = CRITERION_TAG.exec(text)
  return found ? { tag: found[1]!, words: text.slice(found[0].length) } : { tag: '', words: text }
}
