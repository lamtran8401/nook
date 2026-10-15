import { refused, usage } from '@kit/shared/errors.ts'

import { now, write } from '../db.ts'
import type { Kit } from '../kit.ts'
import { assertCan } from '../role.ts'
import { getItem, recordEvent } from './items.ts'

/** Questions to the owner. A blocking one stops agree, approve and the Stop hook until it is answered. */

export type Question = {
  id: string
  item: string
  text: string
  blocking: boolean
  recommended: string | null
  answer: string | null
  status: 'open' | 'answered'
  asked_by: string
  answered_by: string | null
  asked_at: string
  answered_at: string | null
}

type Row = Omit<Question, 'blocking'> & { blocking: number }
const toQuestion = (row: Row): Question => ({ ...row, blocking: row.blocking === 1 })

export function questions(kit: Kit, id?: string, open = false): Question[] {
  const where = [id ? 'item = ?' : null, open ? "status = 'open'" : null].filter(Boolean).join(' AND ')
  const sql = `SELECT * FROM question${where ? ` WHERE ${where}` : ''} ORDER BY asked_at, id`
  const rows = (id ? kit.db.query(sql).all(id) : kit.db.query(sql).all()) as Row[]
  return rows.map(toQuestion)
}

export const openBlocking = (kit: Kit, id: string) => questions(kit, id, true).filter(q => q.blocking)

export function ask(kit: Kit, id: string, text: string, blocking: boolean, recommended?: string): Question {
  assertCan(kit.who, 'ask')
  getItem(kit, id)
  if (!text.trim()) throw usage('give the question')
  const n = (kit.db.query('SELECT COUNT(*) AS n FROM question WHERE item = ?').get(id) as { n: number }).n + 1
  const qid = `Q${n}`
  write(kit.db, () => {
    kit.db.run('INSERT INTO question (id, item, text, blocking, recommended, asked_by, asked_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      qid, id, text.trim(), blocking ? 1 : 0, recommended ?? null, kit.who.actor, now(),
    ])
    recordEvent(kit, id, 'question', { reason: `${qid} asked${blocking ? ' (blocking)' : ''}: ${text.trim().slice(0, 200)}` })
  })
  return questions(kit, id).find(q => q.id === qid)!
}

export function answer(kit: Kit, id: string, qid: string, text: string): Question {
  assertCan(kit.who, 'answer')
  getItem(kit, id)
  const question = questions(kit, id).find(q => q.id === qid.toUpperCase())
  if (!question) throw usage(`${id} has no question ${qid}`, `kit eng questions ${id}`)
  if (question.status === 'answered') throw refused(`${qid} is answered: ${question.answer}`, 'ask a new question when the answer changed')
  if (!text.trim()) throw usage('give the answer')
  write(kit.db, () => {
    kit.db.run("UPDATE question SET answer = ?, status = 'answered', answered_by = ?, answered_at = ? WHERE item = ? AND id = ?", [text.trim(), kit.who.actor, now(), id, question.id])
    recordEvent(kit, id, 'question', { reason: `${question.id} answered: ${text.trim().slice(0, 200)}` })
  })
  return questions(kit, id).find(q => q.id === question.id)!
}
