import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

export type RecordRow = { id: string; main: ReactNode; sub?: ReactNode; end?: ReactNode }

/** Rows of records in one card: a short id in mono, the words with a line under them, and an end level with the first line. */
export function RecordList({ rows }: { rows: RecordRow[] }) {
  return (
    <Card data-record-list="" className="gap-0 px-0 py-0">
      <ol className="divide-y divide-hairline">
        {rows.map(row => (
          <li key={row.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3 px-4 py-2.5">
            <span className="pt-0.5 font-mono text-[11.5px] text-muted-foreground">{row.id}</span>
            <div className="min-w-0">
              <p className="text-[13.5px] leading-[21px]">{row.main}</p>
              {row.sub ? <div className="mt-0.5 text-[12.5px] text-muted-foreground">{row.sub}</div> : null}
            </div>
            <span className="flex min-h-5 items-center">{row.end}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
