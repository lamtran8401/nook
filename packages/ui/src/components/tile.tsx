import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** A raised tile of a page: a small title with a muted note beside it, such as `2 of 6 done`, then what it holds. */
export function Tile({ title, note, children, className }: { title?: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section data-slot="tile" className={cn('flex min-w-0 flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm', className)}>
      {title ? (
        <h2 className="flex items-baseline gap-2 text-[13.5px] font-semibold">
          {title}
          {note === undefined ? null : <span className="font-mono text-xs font-normal text-muted-foreground">{note}</span>}
        </h2>
      ) : null}
      {children}
    </section>
  )
}
