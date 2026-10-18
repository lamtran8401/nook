import type { ReactNode } from 'react'

export type RecordRow = { id: string; main: ReactNode; sub?: ReactNode; end?: ReactNode }

/** The Bench RecordList: a short id, the words with an optional line under them, and a state at the end, on one centre line. */
export function Records({ rows }: { rows: RecordRow[] }) {
  return (
    <ol className="bn-records">
      {rows.map(row => (
        <li key={row.id}>
          <span className="bn-records__id">{row.id}</span>
          <div>
            <p>{row.main}</p>
            {row.sub ? <p className="bn-records__sub">{row.sub}</p> : null}
          </div>
          <span className="bn-records__end">{row.end}</span>
        </li>
      ))}
    </ol>
  )
}
