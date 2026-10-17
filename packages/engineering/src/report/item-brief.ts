import { cut } from '../format.ts'
import type { Engineering } from '../service.ts'
import { nextFor } from './next.ts'

/** The brief of an item for an agent, and `pickup`, which adds the last handoff. */

export const BRIEF_LIMIT = 1800

export function itemBrief(eng: Engineering, id: string, limit = BRIEF_LIMIT): string {
  const item = eng.item(id)
  const step = nextFor(eng, item)
  const areas = item.areas.map(name => {
    const area = eng.home.config.area(name)
    return area ? `${name} → ${area.path} (${area.kind})` : `${name} (not in nook.yml)`
  })
  const head = [
    `${item.id} — ${cut(item.title, 80)} [${item.kind} ${item.size}${item.quick ? ', quick' : ''}]  state: ${item.state}  mode: ${item.mode}`,
    `next: ${step.skill}${step.detail ? ` (${step.detail})` : ''}`,
    `areas: ${areas.join('; ') || 'none'}`,
  ].join('\n')
  const { criteria, slices, questions, guesses } = eng.stores
  const lists: [string, string[]][] = [
    [
      'ACs',
      criteria
        .list(id)
        .map(c => `${c.done ? '[x]' : '[ ]'} ${c.n} ${cut(c.text, 90)}${c.done ? ` (${c.grade})` : ''}`),
    ],
    [
      'slices',
      slices
        .live(id)
        .map(
          s =>
            `${s.id} ${s.state} ${s.area} "${cut(s.title, 50)}"${s.acs.length ? ` acs ${s.acs.join(',')}` : ''}${s.depends.length ? ` after ${s.depends.join(',')}` : ''}${s.assignee ? ` by ${s.assignee}` : ''}`,
        ),
    ],
    [
      'open questions',
      questions
        .list(id, true)
        .map(
          q =>
            `${q.id}${q.blocking ? ' (blocking)' : ''} ${cut(q.text, 90)}${q.recommended ? ` → rec: ${cut(q.recommended, 40)}` : ''}`,
        ),
    ],
    [
      'open guesses',
      guesses
        .list(id, true)
        .map(
          g =>
            `${g.id} (${g.impact}) ${cut(g.question, 60)} → took ${cut(g.took, 40)}${g.slices.length ? ` [${g.slices.join(',')}]` : ''}`,
        ),
    ],
    ['gaps', step.gaps.map(g => `${cut(g.text, 90)} → ${cut(g.fix, 60)}`)],
  ]
  return fitLists(
    head,
    lists.filter(([, entries]) => entries.length),
    limit,
  )
}

/** Each list gets an equal share of the room left, so a long list of slices never hides the questions. */
function fitLists(head: string, lists: [string, string[]][], limit: number): string {
  let text = head
  lists.forEach(([name, entries], i) => {
    const budget = Math.floor((limit - text.length) / (lists.length - i))
    let shown = entries.length
    let block = ''
    do {
      const more = entries.length - shown
      block = `\n${name}:\n${entries
        .slice(0, shown)
        .map(e => `  ${e}`)
        .join('\n')}${more > 0 ? `\n  … and ${more} more` : ''}`
      shown--
    } while (block.length > budget && shown > 0)
    if (block.length <= budget) text += block
  })
  return text
}

/** `pickup <id>`: this session leads the item; the brief, then handoff.md when it exists. */
export function pickup(eng: Engineering, id: string): string {
  eng.takeItem(id)
  const handoff = eng.folder(id).read('handoff.md')
  const parts = [itemBrief(eng, id)]
  if (handoff !== null) parts.push(`--- handoff.md ---\n${handoff.trim()}`)
  return parts.join('\n')
}
