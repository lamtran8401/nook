import { type Ledger, now } from '../ledger.ts'

/** Questions to the owner. An open blocking one stops agree, approve and the Stop hook. */

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

export type NewQuestion = {
  id: string
  item: string
  text: string
  blocking: boolean
  recommended: string | null
  by: string
}

export class QuestionStore {
  constructor(private readonly ledger: Ledger) {}

  list(item?: string, open = false): Question[] {
    const where = [item ? 'item = ?' : null, open ? "status = 'open'" : null].filter(Boolean).join(' AND ')
    const sql = `SELECT * FROM question${where ? ` WHERE ${where}` : ''} ORDER BY asked_at, id`
    const rows = item ? this.ledger.all<Row>(sql, item) : this.ledger.all<Row>(sql)
    return rows.map(row => ({ ...row, blocking: row.blocking === 1 }))
  }

  find(item: string, id: string): Question | undefined {
    return this.list(item).find(q => q.id === id)
  }

  openBlocking(item: string): Question[] {
    return this.list(item, true).filter(q => q.blocking)
  }

  /** `Q<n>`, numbered in each item. */
  nextId(item: string): string {
    return `Q${(this.ledger.get<{ n: number }>('SELECT COUNT(*) AS n FROM question WHERE item = ?', item)?.n ?? 0) + 1}`
  }

  insert(q: NewQuestion): void {
    this.ledger.run(
      'INSERT INTO question (id, item, text, blocking, recommended, asked_by, asked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      q.id,
      q.item,
      q.text,
      q.blocking ? 1 : 0,
      q.recommended,
      q.by,
      now(),
    )
  }

  answer(item: string, id: string, text: string, by: string): void {
    this.ledger.run(
      "UPDATE question SET answer = ?, status = 'answered', answered_by = ?, answered_at = ? WHERE item = ? AND id = ?",
      text,
      by,
      now(),
      item,
      id,
    )
  }
}
