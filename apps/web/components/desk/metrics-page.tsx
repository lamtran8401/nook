import { BarChart3 } from 'lucide-react'

import type { EventGroup } from '@nook/core/retro/retro.ts'
import type { Metrics, Share } from '@nook/engineering/report/metrics.ts'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { SectionHeader } from '@nook/ui/components/section-header.tsx'
import { StatTile } from '@nook/ui/components/stat-tile.tsx'

import { longest, median, percent } from '@/lib/metric-text.ts'

const aside = (words: string | null) => (words ? <span className="text-right text-sm text-muted-foreground">{words}</span> : null)
const ofWhole = (s: Share, words: string) => (s.whole ? `${s.part} of ${s.whole} ${words}` : null)

/** One bar of a list: its label, its share of the largest count, and its count. */
function Bar({ label, count, max, tone }: { label: string; count: number; max: number; tone: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_minmax(5rem,35%)_auto] items-center gap-3 text-sm">
      <span className="[overflow-wrap:anywhere]">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-muted">
        <span data-tone={tone} className="block h-full rounded-full bg-tone" style={{ width: `${Math.round((count / max) * 100)}%` }} />
      </span>
      <span className="font-mono text-xs text-muted-foreground">{count}</span>
    </li>
  )
}

const Muted = ({ children }: { children: string }) => <p className="text-sm text-muted-foreground">{children}</p>

/** The metrics of the last 30 days: the six numbers of the flow, the root causes as bars, and the guard blocks. */
export function MetricsPage({ metrics, blocks }: { metrics: Metrics | null; blocks: EventGroup[] }) {
  if (!metrics) return <EmptyState icon={<BarChart3 className="size-5" aria-hidden="true" />} title="This desk has no engineering">The metrics come from the ledger of the engineering pack.</EmptyState>
  const { rework, firstPass, sliceRework, cycle, approveWait, acceptWait, rootCauses } = metrics
  const causeMax = Math.max(1, ...rootCauses.map(c => c.count))
  const blockMax = Math.max(1, ...blocks.map(b => b.count))
  return (
    <>
      <section className="grid gap-3">
        <SectionHeader title="Flow" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatTile label="Rework rate" value={percent(rework)} aside={aside(ofWhole(rework, 'sent back'))} />
          <StatTile label="First pass" value={percent(firstPass)} aside={aside(ofWhole(firstPass, 'accepted'))} />
          <StatTile label="Slice rework" value={percent(sliceRework)} aside={aside(ofWhole(sliceRework, 'reopened'))} />
          <StatTile label="Cycle time" value={median(cycle)} aside={aside(longest(cycle))} />
          <StatTile label="Approve wait" value={median(approveWait)} aside={aside(longest(approveWait))} />
          <StatTile label="Accept wait" value={median(acceptWait)} aside={aside(longest(acceptWait))} />
        </div>
      </section>
      <section className="grid gap-3">
        <SectionHeader title="Root causes" count={rootCauses.length} />
        {rootCauses.length ? (
          <ul className="grid gap-2 rounded-[18px] bg-card p-4 shadow-[var(--shadow-1)]">
            {rootCauses.map(c => (
              <Bar key={c.type} label={c.type} count={c.count} max={causeMax} tone="danger" />
            ))}
          </ul>
        ) : (
          <Muted>No fix with a root cause was accepted in the last 30 days.</Muted>
        )}
      </section>
      <section className="grid gap-3">
        <SectionHeader title="Guard blocks" count={blocks.length} />
        {blocks.length ? (
          <ul className="grid gap-2 rounded-[18px] bg-card p-4 shadow-[var(--shadow-1)]">
            {blocks.map(b => (
              <Bar key={`${b.hook}${b.reason}`} label={`${b.hook}: ${b.reason}`} count={b.count} max={blockMax} tone="warning" />
            ))}
          </ul>
        ) : (
          <Muted>No guard blocked a call in the last 30 days.</Muted>
        )}
      </section>
    </>
  )
}
