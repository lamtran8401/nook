import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

export type RecordRow = { id: string; main: ReactNode; sub?: ReactNode; end?: ReactNode }

/** Rows of records: a short id in a tile, the words with a line under them, and an end level with the first line. */
export function RecordList({ rows }: { rows: RecordRow[] }) {
  return (
    <Card data-record-list="" className="gap-0 px-5 py-0">
      <ol className="divide-y divide-hairline">
      {rows.map(row => (
        <li key={row.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 py-3">
          <span className="grid size-9 place-items-center rounded-[12px] bg-muted font-mono text-[11px] font-semibold text-muted-foreground">{row.id}</span>
          <div className="min-w-0 pt-1.5">
            <p className="text-[15px] leading-6">{row.main}</p>
            {row.sub ? <p className="mt-0.5 text-sm text-muted-foreground">{row.sub}</p> : null}
          </div>
          <span className="mt-1.5 flex min-h-6 items-center">{row.end}</span>
        </li>
      ))}
      </ol>
    </Card>
  )
}
