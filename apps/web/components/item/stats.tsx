import type { ItemView } from '@nook/engineering/read/reader.ts'
import { PercentRing } from '@nook/ui/components/ring.tsx'
import { StatTile } from '@nook/ui/components/stat-tile.tsx'

import { span } from '@/lib/time.ts'

/** Four numbers of the item: the criteria met, the slices done, the time in its state, and how often it was sent back. */
export function Stats({ view, now }: { view: ItemView; now: Date }) {
  const met = view.criteria.filter(c => c.done).length
  const done = view.slices.filter(s => s.state === 'done').length
  const since = view.moves.at(-1)?.at
  const sentBack = view.moves.filter(m => m.move === 'reject').length
  const [time = '', ...rest] = since ? span(since, now).split(' ') : ['—']
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="Criteria met" value={String(met)} unit={` / ${view.criteria.length}`} aside={view.criteria.length ? <PercentRing value={(100 * met) / view.criteria.length} tone="success" /> : null} />
      <StatTile label="Slices done" value={String(done)} unit={` / ${view.slices.length}`} aside={view.slices.length ? <PercentRing value={(100 * done) / view.slices.length} tone="primary" /> : null} />
      <StatTile label={`In ${view.item.state}`} value={time} unit={rest.length ? ` ${rest.join(' ')}` : ''} />
      <StatTile label="Sent back" value={String(sentBack)} unit={sentBack === 1 ? ' time' : ' times'} />
    </div>
  )
}
