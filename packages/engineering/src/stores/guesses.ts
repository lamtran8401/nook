import { type Ledger, now, parseList } from '../ledger.ts'
import type { Impact } from '../vocabulary.ts'

/** Guesses: the assumptions that an agent took in place of a question to the owner. */

export type GuessStatus = 'open' | 'accepted' | 'flipped'

export type Guess = {
  id: string
  item: string
  question: string
  took: string
  other: string
  impact: Impact
  slices: string[]
  status: GuessStatus
  answer: string | null
  by: string
  at: string
}

type Row = Omit<Guess, 'slices'> & { slices: string }

export type NewGuess = Pick<Guess, 'id' | 'item' | 'question' | 'took' | 'other' | 'impact' | 'slices' | 'by'>

export class GuessStore {
  constructor(private readonly ledger: Ledger) {}

  list(item?: string, open = false): Guess[] {
    const where = [item ? 'item = ?' : null, open ? "status = 'open'" : null].filter(Boolean).join(' AND ')
    const sql = `SELECT * FROM guess${where ? ` WHERE ${where}` : ''} ORDER BY at, id`
    const rows = item ? this.ledger.all<Row>(sql, item) : this.ledger.all<Row>(sql)
    return rows.map(row => ({ ...row, slices: parseList(row.slices) }))
  }

  find(item: string, id: string): Guess | undefined {
    return this.list(item).find(g => g.id === id)
  }

  /** `G<n>`, numbered in each item. */
  nextId(item: string): string {
    return `G${(this.ledger.get<{ n: number }>('SELECT COUNT(*) AS n FROM guess WHERE item = ?', item)?.n ?? 0) + 1}`
  }

  insert(g: NewGuess): void {
    this.ledger.run(
      'INSERT INTO guess (id, item, question, took, other, impact, slices, by, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      g.id,
      g.item,
      g.question,
      g.took,
      g.other,
      g.impact,
      JSON.stringify(g.slices),
      g.by,
      now(),
    )
  }

  setSlices(item: string, id: string, slices: string[]): void {
    this.ledger.run('UPDATE guess SET slices = ? WHERE item = ? AND id = ?', JSON.stringify(slices), item, id)
  }

  decide(item: string, id: string, status: GuessStatus, answer: string | null): void {
    this.ledger.run(
      'UPDATE guess SET status = ?, answer = ? WHERE item = ? AND id = ?',
      status,
      answer,
      item,
      id,
    )
  }
}
