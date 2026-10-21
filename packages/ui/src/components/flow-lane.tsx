import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

export type LanePart = { name: string; tone: string; count: number; points?: number; waits?: number }

/** One thin lane that counts the items of each phase, each part as wide as its count, with its points and what waits for the owner. */
export function FlowLane({ parts }: { parts: LanePart[] }) {
  return (
    <section data-slot="flow-lane" aria-label="Items by phase" className="flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-xs">
      {parts.map((part, i) => (
        <Fragment key={part.name}>
          {i ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground max-[859px]:hidden" aria-hidden="true" /> : null}
          <div data-tone={part.tone} style={{ flex: Math.max(part.count, 1) }} className="flex min-w-0 items-center gap-2 overflow-hidden rounded-full bg-tone-subtle px-3 py-[5px] text-[13px] whitespace-nowrap">
            <span className="font-semibold text-tone">{part.name}</span>
            <b className="font-mono font-semibold">{part.count}</b>
            {part.points === undefined ? null : <span className="text-xs text-muted-foreground tabular-nums max-[859px]:hidden">{part.points} pt</span>}
            {part.waits ? (
              <span title={`${part.waits} wait for you`} className="ml-auto flex items-center gap-1 font-mono text-xs font-medium text-danger">
                <i className="size-2 rounded-full bg-danger" aria-hidden="true" />
                {part.waits}
              </span>
            ) : null}
          </div>
        </Fragment>
      ))}
    </section>
  )
}
