import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/**
 * A section of a page: a hairline, a small title with a faint note beside it, such as `2 of 6 done`, then what it holds.
 * It sits flat on the sheet; only an object inside it rises.
 */
export function Tile({ title, note, children, className }: { title?: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section data-slot="tile" className={cn('flex min-w-0 flex-col gap-3 border-t border-[var(--hairline)] pt-4', className)}>
      {title ? (
        <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-foreground">
          {title}
          {note === undefined ? null : <span className="font-mono text-xs font-normal text-faint">{note}</span>}
        </h2>
      ) : null}
      {children}
    </section>
  )
}
