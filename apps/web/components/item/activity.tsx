import type { EventLine } from '@nook/engineering/read/event-lines.ts'
import { Tile } from '@nook/ui/components/tile.tsx'

import { Receipts } from '@/components/item/overview.tsx'
import { Timeline } from '@/components/item/timeline.tsx'

/** The story of an item: the steps of the flow in order, then every receipt, newest first. */
export function Activity({ events }: { events: EventLine[] }) {
  const steps = events.filter(e => e.step)
  return (
    <>
      <Tile title="Steps" note={steps.length}>
        <Timeline events={steps} />
      </Tile>
      <Receipts events={events.filter(e => !e.step)} />
    </>
  )
}
