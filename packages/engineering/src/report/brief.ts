import { cut } from '../format.ts'
import type { Engineering } from '../service.ts'
import { nextFor } from './next.ts'

/** `brief`: the lines of the pack for `kit brief`, what waits for the owner first. */

export type BriefLine = {
  pack: 'engineering'
  text: string
  urgency: 'now' | 'today' | 'info'
  action: string
  ref: string
}

const DAY_MS = 24 * 60 * 60 * 1000

export function brief(eng: Engineering): BriefLine[] {
  const lines: BriefLine[] = []
  const line = (urgency: BriefLine['urgency'], ref: string, text: string, action: string) =>
    lines.push({ pack: 'engineering', text, urgency, action, ref })
  for (const item of eng.stores.items.open()) {
    const id = item.id
    const blocking = eng.stores.questions.openBlocking(id)
    const step = nextFor(eng, item)
    if (step.owner && !blocking.length) {
      line(
        'now',
        id,
        `${id} waits for your ${item.state === 'planning' ? 'approve' : 'accept'}: ${cut(item.title, 60)}`,
        step.skill.replace(/^owner: /, ''),
      )
    }
    for (const q of blocking)
      line('now', id, `${id} ${q.id} blocks: ${cut(q.text, 80)}`, `kit eng answer ${id} ${q.id} "<answer>"`)
    for (const s of eng.stores.slices.live(id).filter(s => s.state === 'failed')) {
      line(
        'today',
        id,
        `${id} ${s.id} failed: ${cut(s.reason ?? '', 80)}`,
        `kit eng task retry ${id} ${s.id}, or /cook ${id}`,
      )
    }
    if (item.state === 'cooking' && Date.now() - Date.parse(item.updated) > DAY_MS)
      line('today', id, `${id} is cooking with no activity for a day`, `/pickup ${id}`)
  }
  return lines
}

export type DoneLine = { ref: string; text: string }

/** The items accepted since `since`: closed when their archive came after the accept, else accepted. */
export function doneSince(eng: Engineering, since: Date): DoneLine[] {
  const { items, events } = eng.stores
  return items.list().flatMap(item => {
    const accepted = events.last(item.id, 'accept')
    if (!accepted || Date.parse(accepted.at) < since.getTime()) return []
    const archived = events.last(item.id, 'archive')
    const word = archived && archived.id > accepted.id ? 'closed' : 'accepted'
    return [{ ref: item.id, text: `${item.id} ${word}: ${cut(item.title, 60)}` }]
  })
}

export type RunLine = { ref: string; text: string; action: string }

/** The open items that wait for nobody: their state, their running slices and their next step. */
export function runs(eng: Engineering): RunLine[] {
  return eng.stores.items.open().flatMap(item => {
    const step = nextFor(eng, item)
    if (step.owner || eng.stores.questions.openBlocking(item.id).length) return []
    const running = eng.stores.slices
      .live(item.id)
      .filter(s => s.state === 'running')
      .map(s => `${s.id} runs in ${s.area}`)
    const text = `${item.id} ${item.state}: ${cut(item.title, 60)}${running.length ? `; ${running.join(', ')}` : ''}`
    return [{ ref: item.id, text, action: step.skill }]
  })
}
