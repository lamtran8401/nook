import type { Metrics, Share, Times } from '@nook/engineering/report/metrics.ts'
import { TrendTile } from '@nook/ui/components/trend-tile.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

import { longest, median, NO_DATA, percent } from '@/lib/metric-text.ts'

const shareOf = (s: Share) => (s.whole ? (100 * s.part) / s.whole : null)
const pct = (s: Share) => (s.whole ? { value: percent(s).replace('%', ''), unit: '%' } : { value: NO_DATA })
// a time reads `1 d 5 h`: its first number is the value, the rest its unit
const time = (t: Times) => {
  if (t.median === null) return { value: NO_DATA }
  const text = median(t)
  return { value: text.slice(0, text.indexOf(' ')), unit: text.slice(text.indexOf(' ')) }
}
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Each number of the flow as a tile: its value over the last 30 days, its trend over the weeks, and one line. */
const TILES = {
  rework: (m: Metrics, t: Metrics[]) => ({ label: 'Rework rate', ...pct(m.rework), tone: 'danger', points: t.map(w => shareOf(w.rework)), note: `${m.rework.part} of ${m.rework.whole} sent back` }),
  firstPass: (m: Metrics, t: Metrics[]) => ({ label: 'First pass', ...pct(m.firstPass), tone: 'success', points: t.map(w => shareOf(w.firstPass)), note: `${m.firstPass.part} of ${m.firstPass.whole} accepted` }),
  sliceRework: (m: Metrics, t: Metrics[]) => ({ label: 'Slice rework', ...pct(m.sliceRework), tone: 'warning', points: t.map(w => shareOf(w.sliceRework)), note: `${m.sliceRework.part} of ${m.sliceRework.whole} reopened` }),
  cycle: (m: Metrics, t: Metrics[]) => ({ label: 'Cycle time', ...time(m.cycle), tone: 'primary', points: t.map(w => w.cycle.median), note: m.cycle.longest ? `median, ${longest(m.cycle)}` : `median of ${plural(m.cycle.count, 'item', 'items')}` }),
  approveWait: (m: Metrics, t: Metrics[]) => ({ label: 'Approve wait', ...time(m.approveWait), tone: 'violet', points: t.map(w => w.approveWait.median), note: 'your gate, median' }),
  acceptWait: (m: Metrics, t: Metrics[]) => ({ label: 'Accept wait', ...time(m.acceptWait), tone: 'aqua', points: t.map(w => w.acceptWait.median), note: 'your accept, median' }),
}
export type FlowKey = keyof typeof TILES

export function FlowTiles({ metrics, trend, keys, className }: { metrics: Metrics; trend: Metrics[]; keys: FlowKey[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {keys.map(key => (
        <TrendTile key={key} {...TILES[key](metrics, trend)} />
      ))}
    </div>
  )
}
