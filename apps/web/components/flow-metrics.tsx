import { duration } from '@nook/engineering/format.ts'
import type { Metrics, Share } from '@nook/engineering/report/metrics.ts'
import { StatTile } from '@nook/ui/components/stat-tile.tsx'

const NO_DATA = 'No data'
const percent = (s: Share) => (s.whole ? `${Math.round((s.part / s.whole) * 100)}%` : NO_DATA)
const ofWhole = (s: Share, words: string) => (s.whole ? <span className="text-sm text-muted-foreground">{`${s.part} of ${s.whole} ${words}`}</span> : null)

/** How the flow went in the last 30 days: the rework rate, the first pass and the median cycle time; nothing for a desk with no engineering. */
export function FlowMetrics({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) return null
  const { rework, firstPass, cycle } = metrics
  return (
    <section className="grid gap-3">
      <h2 className="text-[19px] font-semibold">Last 30 days</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Rework rate" value={percent(rework)} aside={ofWhole(rework, 'sent back')} />
        <StatTile label="First pass" value={percent(firstPass)} aside={ofWhole(firstPass, 'accepted')} />
        <StatTile
          label="Cycle time"
          value={cycle.median === null ? NO_DATA : duration(cycle.median)}
          aside={cycle.count ? <span className="text-sm text-muted-foreground">{`median of ${cycle.count}`}</span> : null}
        />
      </div>
    </section>
  )
}
