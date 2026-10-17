import { isOneOf, SIZES, type Size } from '../vocabulary.ts'
import { bodyLines, FENCE } from './markdown.ts'

/** `works/<id>/tasks.md`: one `## T<n>: title` section for each slice, then `key: value` lines. */
/** The front matter, the `> In short:` line and every fenced block are not slices. */

export type SliceSpec = {
  id: string
  title: string
  area: string
  depends: string[]
  acs: number[]
  size: Size | null
  /** The files that the slice plans to touch, as the file writes them. */
  files: string | null
  doneWhen: string
  /** `none (reason)` marks a slice with no test to prove. */
  proof: string | null
}

const HEADING = /^##\s+(T\d+)\s*:\s*(.*?)\s*$/
const FIELD = /^(?:[-*]\s+)?([A-Za-z][A-Za-z ]*?)\s*:\s*(.*)$/
const NONE = /^(none|-|—)?$/i
const SLICE_ID = /^T\d+$/

type Section = { id: string; title: string; fields: Map<string, string> }

export class TasksDocument {
  private constructor(
    readonly slices: SliceSpec[],
    readonly problems: string[],
  ) {}

  static parse(text: string): TasksDocument {
    const problems: string[] = []
    const slices = readSections(text).map(section => build(section, problems))
    const seen = new Set<string>()
    for (const slice of slices) {
      if (seen.has(slice.id)) problems.push(`${slice.id} appears twice`)
      seen.add(slice.id)
      for (const dep of slice.depends)
        if (!slices.some(s => s.id === dep))
          problems.push(`${slice.id}: depends names ${dep}, which is not a slice`)
    }
    return new TasksDocument(slices, problems)
  }

  cycle(): string[] | null {
    return dependsCycle(this.slices)
  }
}

function readSections(text: string): Section[] {
  const found: Section[] = []
  let current: Section | null = null
  let fenced = false
  for (const line of bodyLines(text)) {
    if (FENCE.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced || line.startsWith('>')) continue
    const heading = HEADING.exec(line)
    if (heading) {
      current = { id: heading[1]!, title: heading[2]!, fields: new Map() }
      found.push(current)
      continue
    }
    if (/^##?\s/.test(line)) {
      current = null
      continue
    }
    const field = current && FIELD.exec(line.trim())
    if (!current || !field) continue
    const key = field[1]!.toLowerCase().trim()
    if (!current.fields.has(key)) current.fields.set(key, field[2]!.trim())
  }
  return found
}

function build({ id, title, fields }: Section, problems: string[]): SliceSpec {
  const size = (fields.get('size') ?? '').toUpperCase()
  if (size && !isOneOf(SIZES, size)) problems.push(`${id}: size "${size}" is not S, M or L`)
  const area = fields.get('area') ?? ''
  if (!area) problems.push(`${id}: no area`)
  if (!title) problems.push(`${id}: no title`)
  const depends = words(fields.get('depends'))
  for (const dep of depends)
    if (!SLICE_ID.test(dep)) problems.push(`${id}: depends "${dep}" is not a slice id (T1, T2)`)
  const acs = words(fields.get('acs')).map(w => Number(w.replace(/^AC/i, '')))
  const isAc = (n: number) => Number.isInteger(n) && n >= 1
  if (!acs.every(isAc)) problems.push(`${id}: acs must be numbers of the acceptance criteria (1, 2)`)
  return {
    id,
    title,
    area,
    depends: depends.filter(d => SLICE_ID.test(d)),
    acs: acs.filter(isAc),
    size: isOneOf(SIZES, size) ? size : null,
    files: fields.get('files') || null,
    doneWhen: fields.get('done when') ?? '',
    proof: (fields.get('proof') ?? '').trim() || null,
  }
}

const words = (text: string | undefined) =>
  NONE.test((text ?? '').trim())
    ? []
    : (text ?? '')
        .split(/[,\s]+/)
        .map(w => w.trim())
        .filter(Boolean)

/** A path in `depends` that comes back to its start, or null. */
export function dependsCycle(slices: { id: string; depends: string[] }[]): string[] | null {
  const byId = new Map(slices.map(s => [s.id, s.depends]))
  const state = new Map<string, 'in' | 'done'>()
  const path: string[] = []
  const visit = (id: string): string[] | null => {
    if (state.get(id) === 'done') return null
    if (state.get(id) === 'in') return [...path.slice(path.indexOf(id)), id]
    state.set(id, 'in')
    path.push(id)
    for (const dep of byId.get(id) ?? []) {
      const cycle = visit(dep)
      if (cycle) return cycle
    }
    path.pop()
    state.set(id, 'done')
    return null
  }
  for (const slice of slices) {
    const cycle = visit(slice.id)
    if (cycle) return cycle
  }
  return null
}
