import { type Ledger, now } from '../ledger.ts'

export type Note = { id: number; item: string; text: string; by: string; at: string }

export class NoteStore {
  constructor(private readonly ledger: Ledger) {}

  add(item: string, text: string, by: string): void {
    this.ledger.run('INSERT INTO note (item, text, by, at) VALUES (?, ?, ?, ?)', item, text, by, now())
  }

  list(item: string): Note[] {
    return this.ledger.all<Note>('SELECT * FROM note WHERE item = ? ORDER BY id', item)
  }
}
