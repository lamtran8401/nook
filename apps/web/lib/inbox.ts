import type { BriefItem, BriefLine } from '@nook/desk/desks.ts'

/** One move that waits for the owner, as a row of the inbox: a gate, a blocking question, or a command to type. */
export type InboxRowData = { key: string; tone: 'danger' | 'warning'; item?: BriefItem; title: string; sub: string; gate?: 'approve' | 'accept'; question?: string; command?: string }

const GATE = /^\/gate (approve|accept) \S+$/
const ANSWER = /^nook eng answer \S+ (Q\d+) /

const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1)
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The words of a line under the title of its item: the id goes, and so does the title that the line repeats after its colon. */
function subOf(line: BriefLine): string {
  const item = line.item
  let words = item && line.text.startsWith(`${item.id} `) ? line.text.slice(item.id.length + 1) : line.text
  const colon = words.lastIndexOf(': ')
  if (item && colon > 0 && item.title.startsWith(words.slice(colon + 2).replace(/…$/, ''))) words = words.slice(0, colon)
  return capital(words)
}

function rowOf(line: BriefLine): InboxRowData {
  const gate = GATE.exec(line.action ?? '')?.[1] as InboxRowData['gate']
  const question = ANSWER.exec(line.action ?? '')?.[1]
  const move = gate ? { gate } : question ? { question } : line.action ? { command: line.action } : {}
  return { key: `${line.text}${line.action ?? ''}`, tone: line.urgent ? 'danger' : 'warning', ...(line.item ? { item: line.item } : {}), title: line.item?.title ?? subOf(line), sub: line.item ? subOf(line) : '', ...move }
}

/** The moves that wait for the owner, the urgent ones first. */
export const inboxRows = (brief: BriefLine[]): InboxRowData[] =>
  brief.filter(line => line.part === 'waits').sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false)).map(rowOf)

/** One line under the greeting: what waits, what the lead runs, and what is done since yesterday. */
export function summary(brief: BriefLine[]): string {
  const of = (part: BriefLine['part']) => brief.filter(line => line.part === part).length
  const waits = of('waits')
  const runs = of('runs')
  const done = of('done')
  return [
    waits ? `${count(waits, 'move waits', 'moves wait')} for you` : 'Nothing waits for you',
    runs ? `the lead runs ${count(runs, 'item', 'items')}` : 'the lead runs nothing',
    done ? `${done} done since yesterday` : 'nothing done since yesterday',
  ].join(' · ')
}

export function greeting(now: Date): string {
  const hour = now.getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** Who did an event, from the start of its line: you, the lead, or an agent such as backend-builder-a1 by its initials, BB. */
export function whoOf(title: string): { mark: string; who: string } {
  if (title.startsWith('You ')) return { mark: 'YOU', who: 'You' }
  if (title.startsWith('The lead ')) return { mark: 'LD', who: 'The lead' }
  const who = title.split(' ')[0]!
  const initials = who.split('-').filter(word => /^[a-z]/i.test(word)).slice(0, 2).map(word => word[0]!.toUpperCase()).join('')
  return { mark: initials || who.slice(0, 2).toUpperCase(), who }
}
