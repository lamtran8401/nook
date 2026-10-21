import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The list layout of the board: a group folds open and shut, and a row opens in place to show what comes next. Both
 * are `<details>`, so they need no script and a closed row keeps its words in the page.
 */
export function ItemGroup({ title, tone, count, points, children }: { title: string; tone: string; count: number; points?: number; children: ReactNode }) {
  return (
    <details open data-slot="item-group" className="group/list rounded-2xl bg-muted p-1.5">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13.5px] font-semibold [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open/list:rotate-90" aria-hidden="true" />
        <i data-tone={tone} className="size-2 rounded-full bg-tone" aria-hidden="true" />
        {title}
        <span className="font-mono font-medium text-muted-foreground">{count}</span>
        {points === undefined ? null : <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">{points} pt</span>}
      </summary>
      <div className="mt-1 flex flex-col gap-px overflow-hidden rounded-xl bg-border shadow-xs">{children}</div>
    </details>
  )
}

/** One item as a row: its kind, id, title and marks on the first line; opened, the next move and its links. */
export function ItemRow({ kind, id, title, marks, needs = false, children }: { kind: ReactNode; id: string; title: string; marks: ReactNode; needs?: boolean; children: ReactNode }) {
  return (
    <details data-slot="item-row" data-needs={needs} className="group/row bg-surface open:bg-primary-subtle">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[13px] [&::-webkit-details-marker]:hidden">
        {kind}
        <span className="w-[68px] shrink-0 font-mono text-xs text-muted-foreground">{id}</span>
        <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">{marks}</span>
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open/row:rotate-90" aria-hidden="true" />
      </summary>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 pt-0.5 pb-3 pl-[34px] text-[12.5px]">{children}</div>
    </details>
  )
}
