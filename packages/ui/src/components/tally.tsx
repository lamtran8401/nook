import type { ReactNode } from 'react'

export type TallyRow = { tone: string; label: string; value: ReactNode }

/** Rows of a count or a time by name, each with the dot of its tone, such as the criteria by state; `columns` sets them side by side. */
export function Tally({ rows, columns = 1 }: { rows: TallyRow[]; columns?: number }) {
  return (
    <dl data-slot="tally" className="grid gap-x-6 gap-y-1 text-[12.5px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-2">
          <i data-tone={row.tone} className="size-2 shrink-0 rounded-full bg-tone" aria-hidden="true" />
          <dt className="min-w-0 flex-1 truncate text-muted-foreground">{row.label}</dt>
          <dd className="font-mono font-medium tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
