import { BarChart3 } from 'lucide-react'

import type { EventGroup } from '@nook/core/retro/retro.ts'
import type { Metrics } from '@nook/engineering/report/metrics.ts'
import { BarList } from '@nook/ui/components/bar-list.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'

import { FlowTiles } from '@/components/flow-tiles.tsx'
import { day } from '@/lib/time.ts'

const Muted = ({ children }: { children: string }) => <p className="text-[13px] text-muted-foreground">{children}</p>

/** The metrics of the last 30 days: the six numbers of the flow with their trends, the items done each week, the root causes and the guard blocks. */
export function MetricsPage({ metrics, trend, blocks }: { metrics: Metrics | null; trend: Metrics[]; blocks: EventGroup[] }) {
  if (!metrics) return <EmptyState icon={<BarChart3 className="size-5" aria-hidden="true" />} title="This workspace has no engineering">The metrics come from the ledger of the engineering feature.</EmptyState>
  return (
    <>
      <FlowTiles metrics={metrics} trend={trend} keys={['rework', 'firstPass', 'sliceRework', 'cycle', 'approveWait', 'acceptWait']} className="lg:grid-cols-3" />
      <div className="grid items-start gap-3 md:grid-cols-2">
        <Tile title="Items done by week" note="accepts">
          <BarList rows={trend.map(week => ({ label: `week to ${day(week.until)}`, value: week.firstPass.whole, tone: 'primary' }))} />
        </Tile>
        <Tile title="Root causes of fixes" note={metrics.rootCauses.length}>
          {metrics.rootCauses.length ? <BarList rows={metrics.rootCauses.map(c => ({ label: c.type, value: c.count, tone: 'danger' }))} /> : <Muted>No fix with a root cause was accepted in the last 30 days.</Muted>}
        </Tile>
      </div>
      <Tile title="Guard blocks" note={blocks.length}>
        {blocks.length ? <BarList rows={blocks.map(b => ({ label: `${b.hook}: ${b.reason}`, value: b.count, tone: 'warning' }))} /> : <Muted>No guard blocked a call in the last 30 days.</Muted>}
      </Tile>
    </>
  )
}
