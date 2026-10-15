import { SIZES, type Size } from './spec.ts'

/** The parser of `work/<id>/tasks.md`: one `## T<n>: title` section for each slice, then `key: value` lines. */

export type SliceSpec = {
  id: string
  title: string
  area: string
  depends: string[]
  acs: number[]
  size: Size | null
  doneWhen: string
  /** `none (reason)` marks a slice with no test to prove. */
  proof: string | null
}

export type Tasks = { slices: SliceSpec[]; problems: string[] }

const COMMENT = /<!--[\s\S]*?-->/g
const HEADING = /^##\s+(T\d+)\s*:\s*(.*?)\s*$/
const FIELD = /^(?:[-*]\s+)?([A-Za-z][A-Za-z ]*?)\s*:\s*(.*)$/
const NONE = /^(none|-|—)?$/i

export function parseTasks(text: string): Tasks {
  const problems: string[] = []
  const slices: SliceSpec[] = []
  let current: { id: string; title: string; fields: Map<string, string> } | null = null
  const finish = () => {
    if (current) slices.push(build(current.id, current.title, current.fields, problems))
    current = null
  }
  for (const line of text.replace(COMMENT, '').split(/\r?\n/)) {
    const heading = HEADING.exec(line)
    if (heading) {
      finish()
      current = { id: heading[1]!, title: heading[2]!, fields: new Map() }
      continue
    }
    if (/^##?\s/.test(line)) {
      finish()
      continue
    }
    const field = current && FIELD.exec(line.trim())
    if (current && field) {
      const key = field[1]!.toLowerCase().trim()
      if (!current.fields.has(key)) current.fields.set(key, field[2]!.trim())
    }
  }
  finish()
  const seen = new Set<string>()
  for (const slice of slices) {
    if (seen.has(slice.id)) problems.push(`${slice.id} appears twice`)
    seen.add(slice.id)
    for (const dep of slice.depends) if (!seen.has(dep) && !slices.some(s => s.id === dep)) problems.push(`${slice.id}: depends names ${dep}, which is not a slice`)
  }
  return { slices, problems }
}

function build(id: string, title: string, fields: Map<string, string>, problems: string[]): SliceSpec {
  const size = (fields.get('size') ?? '').toUpperCase()
  if (size && !SIZES.includes(size as Size)) problems.push(`${id}: size "${size}" is not S, M or L`)
  const area = fields.get('area') ?? ''
  if (!area) problems.push(`${id}: no area`)
  if (!title) problems.push(`${id}: no title`)
  const depends = words(fields.get('depends'))
  for (const dep of depends) if (!/^T\d+$/.test(dep)) problems.push(`${id}: depends "${dep}" is not a slice id (T1, T2)`)
  const acsWords = words(fields.get('acs'))
  const acs = acsWords.map(w => Number(w.replace(/^AC/i, '')))
  if (acs.some(n => !Number.isInteger(n) || n < 1)) problems.push(`${id}: acs must be numbers of the acceptance criteria (1, 2)`)
  const proof = (fields.get('proof') ?? '').trim()
  return {
    id,
    title,
    area,
    depends: depends.filter(d => /^T\d+$/.test(d)),
    acs: acs.filter(n => Number.isInteger(n) && n >= 1),
    size: SIZES.includes(size as Size) ? (size as Size) : null,
    doneWhen: fields.get('done when') ?? '',
    proof: proof || null,
  }
}

const words = (text: string | undefined) => (NONE.test((text ?? '').trim()) ? [] : (text ?? '').split(/[,\s]+/).map(w => w.trim()).filter(Boolean))

/** A path in `depends` that comes back to its start. */
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
