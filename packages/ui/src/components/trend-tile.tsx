import type { ReactNode } from 'react'

import { Sparkline } from '@nook/ui/components/sparkline.tsx'

/** A number of the flow on a tile: its label, the value with its unit, the trend of the last weeks, and one muted line. */
export function TrendTile({ label, value, unit, points, tone, note }: { label: string; value: string; unit?: string; points: (number | null)[]; tone: string; note?: ReactNode }) {
  return (
    <section data-slot="trend-tile" className="flex min-w-0 flex-col gap-1.5 rounded-lg bg-card p-4 shadow-sm">
      <h2 className="text-[13px] font-semibold text-muted-foreground">{label}</h2>
      <p className="font-mono text-[26px] leading-8 font-medium tracking-[-0.02em]">
        {value}
        {unit ? <small className="ml-0.5 font-sans text-[13px] font-normal text-faint">{unit}</small> : null}
      </p>
      <Sparkline points={points} tone={tone} label={`${label}, one point for each week`} />
      {note ? <p className="text-xs text-faint">{note}</p> : null}
    </section>
  )
}
