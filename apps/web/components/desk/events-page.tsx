import { ScrollText } from 'lucide-react'

import type { DeskEvent } from '@nook/desk/events.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

import { clock, day } from '@/lib/time.ts'

const KINDS = [
  { kind: undefined, label: 'All' },
  { kind: 'prompt', label: 'Prompts' },
  { kind: 'block', label: 'Blocks' },
  { kind: 'error', label: 'Errors' },
] as const
const KIND_TONE: Record<DeskEvent['kind'], string> = { prompt: 'neutral', block: 'warning', error: 'danger' }

/** The pill links of the filter by kind; the open one is marked. */
function Filter({ kind, base }: { kind?: string | undefined; base: string }) {
  return (
    <nav aria-label="Kind" className="flex flex-wrap gap-1.5">
      {KINDS.map(k => (
        <a
          key={k.label}
          href={k.kind ? `${base}/events?kind=${k.kind}` : `${base}/events`}
          {...(k.kind === kind ? { 'aria-current': 'page' as const } : {})}
          className={cn('rounded-full bg-card px-3 py-1 text-sm text-muted-foreground shadow-[var(--shadow-1)] hover:text-foreground', k.kind === kind && 'bg-foreground text-background hover:text-background')}
        >
          {k.label}
        </a>
      ))}
    </nav>
  )
}

/** The words of an event: the prompt, or the hook and its agent with the reason. */
const wordsOf = (e: DeskEvent) => (e.kind === 'prompt' ? (e.text ?? '') : `${e.hook} (${e.agent}): ${e.reason}`)

/** The event log of the desk, newest first, with the filter by kind. */
export function EventsPage({ events, kind, base }: { events: DeskEvent[]; kind?: string | undefined; base: string }) {
  return (
    <>
      <Filter kind={kind} base={base} />
      {events.length ? (
        <ul className="divide-y divide-hairline overflow-hidden rounded-[18px] bg-card shadow-[var(--shadow-1)]">
          {events.map((e, i) => (
            <li key={`${e.at}${i}`} className="grid grid-cols-[6.5rem_4.5rem_minmax(0,1fr)] items-start gap-3 px-4 py-2.5 text-sm">
              <time dateTime={e.at} className="font-mono text-xs text-muted-foreground">{`${day(e.at)} ${clock(e.at)}`}</time>
              <Badge tone={KIND_TONE[e.kind]}>{e.kind}</Badge>
              <div className="grid min-w-0 gap-0.5">
                <p className="[overflow-wrap:anywhere]">{wordsOf(e)}</p>
                {e.kind !== 'prompt' && e.command ? <code className="truncate font-mono text-xs text-muted-foreground">{e.command}</code> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<ScrollText className="size-5" aria-hidden="true" />} title="No event here yet">Each block of a guard, each error of a hook and each prompt lands in the log of the desk.</EmptyState>
      )}
    </>
  )
}
