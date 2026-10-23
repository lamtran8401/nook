export type BarRow = { label: string; value: number; tone: string }

/** Counts as bars on a muted frame: each label, its bar as long as its share of the largest, and its count. */
export function BarList({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map(row => row.value))
  return (
    <ul data-slot="bar-list" className="grid gap-2">
      {rows.map(row => (
        <li key={row.label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_2rem] items-center gap-3 text-[13px]">
          <span className="truncate" title={row.label}>{row.label}</span>
          <span className="h-3.5 overflow-hidden rounded-full bg-muted">
            <span data-tone={row.tone} className="block h-full min-w-1.5 rounded-full bg-tone" style={{ width: `${Math.round((row.value / max) * 100)}%` }} />
          </span>
          <span className="text-right font-mono text-xs text-muted-foreground">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}
