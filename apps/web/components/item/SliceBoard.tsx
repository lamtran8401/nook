import type { Slice } from '@nook/engineering/stores/slices.ts'

import { Diagram } from '../Diagram.tsx'

const COLUMNS: { title: string; tone: string; states: Slice['state'][] }[] = [
  { title: 'To do', tone: 'neutral', states: ['todo', 'waiting'] },
  { title: 'Building', tone: 'primary', states: ['running', 'failed'] },
  { title: 'Done', tone: 'success', states: ['done'] },
]

/** A card of the Bench board: a failed or waiting slice says why, a slice to do names the slices it waits for. */
function card(slice: Slice) {
  const base = { id: slice.id, title: slice.title, areas: [{ name: slice.area }], ...(slice.assignee ? { note: slice.assignee, noteIcon: 'user' } : {}) }
  if (slice.state === 'failed') return { ...base, flag: 'fail', foot: [{ icon: 'alert', text: slice.reason ?? 'failed', kind: 'fail' }] }
  if (slice.state === 'waiting') return { ...base, flag: 'wait', foot: [{ icon: 'clock', text: slice.reason ?? 'waits', kind: 'wait' }] }
  if (slice.state === 'todo' && slice.depends.length) return { ...base, foot: [{ icon: 'link', text: `after ${slice.depends.join(', ')}` }] }
  return base
}

/** The slices of the item on a board by state. A cancelled slice is left out. */
export function SliceBoard({ slices }: { slices: Slice[] }) {
  if (!slices.length) return <p className="nk-empty">No slice yet. The plan step writes them in tasks.md.</p>
  const columns = COLUMNS.map(({ title, tone, states }) => ({ title, tone, cards: slices.filter(s => states.includes(s.state)).map(card) }))
  return <Diagram spec={{ type: 'board', colWidth: 260, columns }} />
}
