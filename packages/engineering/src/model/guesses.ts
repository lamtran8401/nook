import { refused, usage } from '@kit/shared/errors.ts'

import { now, parseList, write } from '../db.ts'
import type { Kit } from '../kit.ts'
import { assertCan } from '../role.ts'
import { getItem, recordEvent } from './items.ts'

/** A guess: an assumption that an agent took in place of a question. A flip sends its slices back to todo. */

export const IMPACTS = ['low', 'med', 'high'] as const

export type Guess = {
  id: string
  item: string
  question: string
  took: string
  other: string
  impact: (typeof IMPACTS)[number]
  slices: string[]
  status: 'open' | 'accepted' | 'flipped'
  answer: string | null
  by: string
  at: string
}

type Row = Omit<Guess, 'slices'> & { slices: string }
const toGuess = (row: Row): Guess => ({ ...row, slices: parseList(row.slices) })

export function guesses(kit: Kit, id?: string, open = false): Guess[] {
  const where = [id ? 'item = ?' : null, open ? "status = 'open'" : null].filter(Boolean).join(' AND ')
  const sql = `SELECT * FROM guess${where ? ` WHERE ${where}` : ''} ORDER BY at, id`
  const rows = (id ? kit.db.query(sql).all(id) : kit.db.query(sql).all()) as Row[]
  return rows.map(toGuess)
}

export type NewGuess = { question: string; took: string; other: string; impact: string; slices: string[] }

export function addGuess(kit: Kit, id: string, input: NewGuess): Guess {
  assertCan(kit.who, 'guess')
  getItem(kit, id)
  if (!IMPACTS.includes(input.impact as Guess['impact'])) throw usage('impact must be low, med or high')
  if (!input.question.trim() || !input.took.trim() || !input.other.trim()) throw usage('give the question, what you took (--took) and the other option (--other)')
  const known = new Set((kit.db.query('SELECT id FROM slice WHERE item = ?').all(id) as { id: string }[]).map(s => s.id))
  for (const slice of input.slices) if (!known.has(slice)) throw usage(`${id} has no slice ${slice}`, `kit eng task list ${id}`)
  const n = (kit.db.query('SELECT COUNT(*) AS n FROM guess WHERE item = ?').get(id) as { n: number }).n + 1
  const gid = `G${n}`
  write(kit.db, () => {
    kit.db.run('INSERT INTO guess (id, item, question, took, other, impact, slices, by, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      gid, id, input.question.trim(), input.took.trim(), input.other.trim(), input.impact, JSON.stringify(input.slices), kit.who.actor, now(),
    ])
    recordEvent(kit, id, 'guess', { reason: `${gid} (${input.impact}): took "${input.took.trim()}" over "${input.other.trim()}"` })
  })
  return guesses(kit, id).find(g => g.id === gid)!
}

/** accept keeps the work; flip sends the slices of the guess back to todo and leaves every other slice as it is. */
export function decideGuess(kit: Kit, id: string, gid: string, decision: 'accept' | 'flip', answer?: string): Guess & { reset: string[] } {
  assertCan(kit.who, decision === 'accept' ? 'guess accept' : 'guess flip')
  getItem(kit, id)
  const guess = guesses(kit, id).find(g => g.id === gid.toUpperCase())
  if (!guess) throw usage(`${id} has no guess ${gid}`, `kit eng guesses ${id}`)
  if (guess.status !== 'open') throw refused(`${guess.id} is ${guess.status}`, 'record a new guess when the answer changed again')
  const reset: string[] = []
  write(kit.db, () => {
    kit.db.run('UPDATE guess SET status = ?, answer = ? WHERE item = ? AND id = ?', [decision === 'accept' ? 'accepted' : 'flipped', answer ?? null, id, guess.id])
    if (decision === 'flip') {
      for (const slice of guess.slices) {
        const row = kit.db.query('SELECT state FROM slice WHERE item = ? AND id = ?').get(id, slice) as { state: string } | null
        if (!row || row.state === 'cancelled') continue
        kit.db.run("UPDATE slice SET state = 'todo', assignee = NULL, reason = ?, version = version + 1 WHERE item = ? AND id = ?", [`${guess.id} flipped`, id, slice])
        reset.push(slice)
      }
    }
    recordEvent(kit, id, 'guess', { reason: `${guess.id} ${decision === 'accept' ? 'accepted' : 'flipped'}${reset.length ? `; back to todo: ${reset.join(', ')}` : ''}${answer ? `; answer: ${answer}` : ''}` })
  })
  return { ...guesses(kit, id).find(g => g.id === guess.id)!, reset }
}
