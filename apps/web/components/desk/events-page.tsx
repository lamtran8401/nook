import { ScrollText } from 'lucide-react'

import type { DeskEvent } from '@nook/desk/events.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'

import { clock, dayHeading } from '@/lib/time.ts'

const KINDS = [undefined, 'block', 'error', 'prompt'] as const
const KIND_TONE: Record<DeskEvent['kind'], string> = { prompt: 'neutral', block: 'warning', error: 'danger' }

/** Where an event comes from: the hook that blocked or failed, or the prompt of the owner. */
const sourceOf = (e: DeskEvent) => (e.kind === 'prompt' ? 'prompt' : (e.hook ?? e.kind))
const wordsOf = (e: DeskEvent) => (e.kind === 'prompt' ? (e.text ?? '') : `${e.reason ?? ''}${e.agent ? ` (${e.agent})` : ''}`)

/** The events in groups by day, newest first: Today, Yesterday, then the day by name. */
function daysOf(events: DeskEvent[], now: Date): { day: string; events: DeskEvent[] }[] {
  const yesterday = new Date(now.getTime() - 86_400_000)
  const nameOf = (at: string) => (dayHeading(at) === dayHeading(now.toISOString()) ? 'Today' : dayHeading(at) === dayHeading(yesterday.toISOString()) ? 'Yesterday' : dayHeading(at))
  const days: { day: string; events: DeskEvent[] }[] = []
  for (const event of events) {
    const day = nameOf(event.at)
    if (days.at(-1)?.day !== day) days.push({ day, events: [] })
    days.at(-1)!.events.push(event)
  }
  return days
}

/** The event log of the desk, newest first, in one card by day, with the filter by kind on top. */
export function EventsPage({ events, kind, base, now }: { events: DeskEvent[]; kind?: string | undefined; base: string; now: Date }) {
  const tabs = KINDS.map(k => ({ href: k ? `${base}/events?kind=${k}` : `${base}/events`, label: k ?? 'all', current: k === kind }))
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <LinkTabs tabs={tabs} label="Kind" variant="segment" />
        <span className="ml-auto text-xs text-muted-foreground">
          one file a day in <code className="font-mono">.nook/events/</code>
        </span>
      </div>
      {events.length ? (
        <Tile>
          {daysOf(events, now).map(group => (
            <section key={group.day} className="grid gap-1">
              <h2 className="text-[13px] font-semibold">{group.day}</h2>
              <ul className="divide-y divide-hairline">
                {group.events.map((e, i) => (
                  <li key={`${e.at}${i}`} className="grid grid-cols-[3rem_4.5rem_8rem_minmax(0,1fr)] items-start gap-3 py-2 text-[13px] max-md:grid-cols-[3rem_minmax(0,1fr)]">
                    <time dateTime={e.at} className="pt-px font-mono text-xs text-muted-foreground">{clock(e.at)}</time>
                    <span className="max-md:hidden">
                      <Badge tone={KIND_TONE[e.kind]}>{e.kind}</Badge>
                    </span>
                    <span className="truncate pt-px font-mono text-xs text-muted-foreground max-md:hidden">{sourceOf(e)}</span>
                    <div className="grid min-w-0 gap-0.5">
                      <p className="[overflow-wrap:anywhere]">{wordsOf(e)}</p>
                      {e.kind !== 'prompt' && e.command ? <code className="truncate font-mono text-xs text-muted-foreground">{e.command}</code> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Tile>
      ) : (
        <EmptyState icon={<ScrollText className="size-5" aria-hidden="true" />} title="No event here yet">Each block of a guard, each error of a hook and each prompt lands in the log of the desk.</EmptyState>
      )}
    </>
  )
}
