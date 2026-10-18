import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { ItemCard } from './ItemCard.tsx'

// the states in the order of the flow; a blocked item keeps its own column
const FLOW = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'blocked', 'done']

/** The items of the desk: one column for each state that holds an item, in the order of the flow. */
export function Board({ cards }: { cards: BoardCard[] }) {
  if (!cards.length) return <p className="nk-empty">No item yet. Type /intake in the agent session to start one.</p>
  const columns = FLOW.map(state => ({ state, cards: cards.filter(c => c.state === state) })).filter(c => c.cards.length)
  return (
    <div className="nk-board">
      {columns.map(column => (
        <section className="nk-col" data-state={column.state} key={column.state}>
          <h2 className="nk-col__head">
            {column.state} <span className="bn-badge">{column.cards.length}</span>
          </h2>
          <div className="nk-col__cards">
            {column.cards.map(c => (
              <ItemCard card={c} key={c.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
