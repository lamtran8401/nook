import { match } from 'ts-pattern'

import type { Gap } from '../guards/guard.ts'
import type { State } from '../machine.ts'
import { ownerStep } from '../owner-step.ts'
import type { Engineering } from '../service.ts'
import type { Item } from '../stores/items.ts'

/** `next`: the next step of each item, the skill to type or the command of the owner. */

export type Next = { id: string; state: State; skill: string; owner: boolean; gaps: Gap[]; detail: string }

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

export function nextFor(eng: Engineering, item: Item): Next {
  const id = item.id
  const base = { id, state: item.state, owner: false, gaps: [] as Gap[], detail: '' }
  const blocking = eng.stores.questions.openBlocking(id)
  if (blocking.length) {
    const skill = `answer ${blocking.map(q => q.id).join(', ')}: kit eng answer ${id} ${blocking[0]!.id} "<answer>"`
    return { ...base, skill, owner: true, detail: blocking.map(q => `${q.id} ${q.text}`).join('; ') }
  }
  return match(item.state)
    .with('backlog', () => ({ ...base, skill: `/spec ${id}` }))
    .with('framing', () => ({ ...base, skill: `/spec ${id}`, detail: 'continue the spec' }))
    .with('planning', () => {
      const found = eng.gaps(item, 'approve')
      if (!found.length) return { ...base, skill: ownerStep(`approve ${id}`), owner: true }
      return {
        ...base,
        skill: `/recipe ${id}`,
        gaps: found,
        detail: `${plural(found.length, 'gap')} before the approve`,
      }
    })
    .with('ready', () => ({ ...base, skill: `/cook ${id}`, gaps: eng.gaps(item, 'begin') }))
    .with('cooking', () => ({
      ...base,
      skill: `/cook ${id}`,
      gaps: eng.gaps(item, 'submit'),
      detail: cookingDetail(eng, id),
    }))
    .with('review', () => {
      const found = eng.gaps(item, 'accept')
      if (!found.length) return { ...base, skill: ownerStep(`accept ${id}`), owner: true }
      return {
        ...base,
        skill: `/quality-check ${id}`,
        gaps: found,
        detail: `${plural(found.length, 'gap')} before the accept`,
      }
    })
    .with('done', () => ({ ...base, skill: isArchived(eng, id) ? 'closed' : `/close ${id}` }))
    .with('blocked', () => ({
      ...base,
      skill: `kit eng item unblock ${id} when it is resolved`,
      detail: item.reason ?? '',
    }))
    .with('cancelled', () => ({ ...base, skill: item.state }))
    .exhaustive()
}

function cookingDetail(eng: Engineering, id: string): string {
  const live = eng.stores.slices.live(id)
  const done = live.filter(s => s.state === 'done').length
  const running = live.filter(s => s.state === 'running').length
  return `${done}/${live.length} slices done, ${running} running, ${eng.stores.slices.ready(id).length} ready`
}

/** Closed: the ticket was archived after the last reopen; an archive from before a reopen closed the old work only. */
const isArchived = (eng: Engineering, id: string) => {
  const archived = eng.stores.events.last(id, 'archive')
  const reopened = eng.stores.events.last(id, 'reopen')
  return archived !== null && (reopened === null || archived.id > reopened.id)
}

const ORDER: Record<State, number> = {
  review: 0,
  cooking: 1,
  ready: 2,
  planning: 3,
  framing: 4,
  backlog: 5,
  blocked: 6,
  done: 7,
  cancelled: 9,
}

/** `next [<id>]`: the lines, the owner's first, then by state. */
export function next(eng: Engineering, id?: string): Next[] {
  const items = id
    ? [eng.item(id)]
    : [...eng.stores.items.open(), ...eng.stores.items.list('done').filter(i => !isArchived(eng, i.id))]
  return items
    .map(item => nextFor(eng, item))
    .sort((a, b) => Number(b.owner) - Number(a.owner) || ORDER[a.state] - ORDER[b.state])
}
