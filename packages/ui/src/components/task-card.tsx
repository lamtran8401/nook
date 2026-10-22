import type { ReactNode } from 'react'

/** One task of a plan on a small card: its kicker, its title, its rows, and a foot that says when it can start. */
export function TaskCard({ kicker, title, rows, foot }: { kicker: ReactNode; title: ReactNode; rows: [label: string, value: ReactNode][]; foot?: ReactNode }) {
  return (
    <div data-task="" className="grid gap-2 rounded-md bg-surface px-3.5 py-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-muted-foreground">{kicker}</div>
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
        {rows.flatMap(([label, value]) => [
          <dt key={`${label}-t`} className="text-[11.5px] font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>,
          <dd key={`${label}-d`} className="min-w-0">{value}</dd>,
        ])}
      </dl>
      {foot ? <div className="flex gap-1.5">{foot}</div> : null}
    </div>
  )
}
