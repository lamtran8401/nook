import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

/** One task of a plan: its kicker, its title, its rows, and a foot that says when it can start. */
export function TaskCard({ kicker, title, rows, foot }: { kicker: ReactNode; title: ReactNode; rows: [label: string, value: ReactNode][]; foot?: ReactNode }) {
  return (
    <Card data-task="" className="gap-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">{kicker}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        {rows.flatMap(([label, value]) => [
          <dt key={`${label}-t`} className="text-muted-foreground">{label}</dt>,
          <dd key={`${label}-d`} className="min-w-0">{value}</dd>,
        ])}
      </dl>
      {foot ? <div className="flex gap-1.5">{foot}</div> : null}
    </Card>
  )
}
