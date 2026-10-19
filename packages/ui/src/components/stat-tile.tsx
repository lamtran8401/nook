import type { ReactNode } from 'react'

/** One number with its label and unit, and a part beside it such as a ring. */
export function StatTile({ label, value, unit, aside }: { label: string; value: string; unit?: string; aside?: ReactNode }) {
  return (
    <div data-slot="stat-tile" className="flex items-center justify-between gap-3 rounded-lg bg-card px-5 py-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight">
          {value}
          {unit ? <small className="text-base font-medium text-muted-foreground">{unit}</small> : null}
        </p>
      </div>
      {aside}
    </div>
  )
}
