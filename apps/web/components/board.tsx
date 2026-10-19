import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { Diagram } from '@/components/diagram.tsx'
import { EmptyState } from '@/components/empty-state.tsx'
import { areaTone, KIND_TONE, STATE_TONE } from '@/components/tones.ts'
import { turnTitle } from '@/lib/turn.ts'

// the states in the order of the flow; a blocked item keeps its own column
const FLOW = ['backlog', 'framing', 'planning', 'ready', 'cooking', 'review', 'blocked', 'done']
const KIND_ICON: Record<string, string> = { feature: 'sparkle', fix: 'alert', chore: 'settings', investigate: 'search' }

const failed = (flag: string) => flag.endsWith('failed')

/** One item as a card of the Bench board: it links to the item, and rings red for a failed slice or amber for a blocking question. */
function benchCard(card: BoardCard, areas: string[]) {
  const { met, total } = card.criteria
  const ring = card.flags.some(failed) ? 'fail' : card.flags.length ? 'wait' : null
  return {
    id: card.id,
    title: card.title,
    href: `/works/${card.id}`,
    kind: card.kind,
    kindTone: KIND_TONE[card.kind] ?? 'neutral',
    kindIcon: KIND_ICON[card.kind] ?? 'file',
    size: card.size,
    areas: card.areas.map(name => ({ name, tone: areaTone(name, areas) })),
    ...(total ? { meter: { value: met, max: total, text: `${met}/${total} criteria`, tone: 'success' } } : {}),
    // the card shows its id already, so the next step leaves it out: The lead runs /cook
    note: turnTitle(card.next).replace(` ${card.id}`, ''),
    noteIcon: card.next.owner ? 'user' : 'bot',
    ...(card.flags.length ? { foot: card.flags.map(flag => (failed(flag) ? { icon: 'alert', text: flag, kind: 'fail' } : { icon: 'clock', text: flag, kind: 'wait' })) } : {}),
    ...(ring ? { flag: ring } : {}),
  }
}

/** The items of the desk on the Bench board: a column for each state that holds an item, the empty states in its panel. */
export function Board({ cards, areas }: { cards: BoardCard[]; areas: string[] }) {
  if (!cards.length) return <EmptyState icon="inbox" title="No item yet">Type /intake in the agent session to start one.</EmptyState>
  const states = FLOW.map(state => ({ state, cards: cards.filter(c => c.state === state) }))
  const columns = states.filter(s => s.cards.length).map(s => ({ title: s.state, tone: STATE_TONE[s.state] ?? 'neutral', cards: s.cards.map(c => benchCard(c, areas)) }))
  const rest = states.filter(s => !s.cards.length && s.state !== 'blocked').map(s => ({ title: s.state, tone: STATE_TONE[s.state] ?? 'neutral', count: 0 }))
  return (
    <div className="nk-board">
      <Diagram spec={{ type: 'board', frame: false, colWidth: 190, colHeight: 1200, columns, ...(rest.length ? { rest, restTitle: 'No items' } : {}) }} />
    </div>
  )
}
