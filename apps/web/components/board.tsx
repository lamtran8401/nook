import { Inbox } from 'lucide-react'
import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { Diagram } from '@/components/diagram.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { areaTone, KIND_TONE, STATE_TONE } from '@/components/tones.ts'
import { turnTitle } from '@/lib/turn.ts'

// the states in the order of the flow; blocked is no step, so its column shows only while an item is blocked
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

/** The items of the desk on the Bench board: a column for each state of the flow, the empty ones too; a narrow page scrolls sideways. */
export function Board({ cards, areas }: { cards: BoardCard[]; areas: string[] }) {
  if (!cards.length) return <EmptyState icon={<Inbox className="size-5" aria-hidden="true" />} title="No item yet">Type /intake in the agent session to start one.</EmptyState>
  const columns = FLOW.map(state => ({ state, cards: cards.filter(c => c.state === state) }))
    .filter(column => column.state !== 'blocked' || column.cards.length)
    .map(column => ({ title: column.state, tone: STATE_TONE[column.state] ?? 'neutral', cards: column.cards.map(c => benchCard(c, areas)) }))
  return (
    <div data-wide>
      <Diagram spec={{ type: 'board', frame: false, colWidth: 190, colHeight: 0, emptyText: 'None', columns }} />
    </div>
  )
}
