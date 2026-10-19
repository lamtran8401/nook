import type { EventLine } from '@nook/engineering/read/event-lines.ts'

import { clock, dayHeading } from '@/lib/time.ts'
import { Diagram } from '@/components/Diagram.tsx'

const ICON: Record<EventLine['tone'], string> = { success: 'check', danger: 'alert', warning: 'alert', primary: 'play', neutral: 'clock' }

/** What happened to the item, in order, under a heading for each day. */
export function Timeline({ events }: { events: EventLine[] }) {
  const items: object[] = []
  let heading = ''
  for (const event of events) {
    const day = dayHeading(event.at)
    if (day !== heading) items.push({ day: (heading = day) })
    items.push({ time: clock(event.at), icon: ICON[event.tone], tone: event.tone, title: event.title, ...(event.text ? { text: event.text } : {}) })
  }
  return <Diagram spec={{ type: 'timeline', items }} />
}
