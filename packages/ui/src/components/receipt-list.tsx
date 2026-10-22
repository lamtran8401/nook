import type { ReactNode } from 'react'

/** `mark` is the short name of who did it, such as YOU, LD or BB; `who` names it in full on hover. */
export type ReceiptRow = { key: string; time: string; mark: string; who: string; tone: string; title: ReactNode; text?: ReactNode }

/** What happened, one compact row each: the time, the mark of who did it in the tone of the event, the sentence and its proof in mono. */
export function ReceiptList({ rows }: { rows: ReceiptRow[] }) {
  return (
    <ol data-slot="receipt-list" className="grid">
      {rows.map(row => (
        <li key={row.key} className="grid grid-cols-[40px_28px_minmax(0,1fr)] items-start gap-3 border-b border-hairline py-2.5 last:border-0">
          <span className="pt-1 font-mono text-[11.5px] text-muted-foreground">{row.time}</span>
          <span data-tone={row.tone} title={row.who} className="grid size-7 place-items-center rounded-full bg-tone-subtle font-mono text-[10px] font-semibold text-tone">
            {row.mark}
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] leading-5">{row.title}</p>
            {row.text ? <p className="truncate font-mono text-[11.5px] text-muted-foreground">{row.text}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
