import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/**
 * A group of cards on a muted ground, such as a phase of the board or the backlog: a header with its dot, title, count,
 * points and one line on its use, then the cards in a column or a grid. With no card it says what is empty.
 */
export function Frame({ title, tone, count, points, about, chips, layout = 'column', empty, children, className }: {
  title: string
  tone?: string
  count: number
  points?: number
  about?: string
  chips?: ReactNode
  layout?: 'column' | 'grid'
  empty?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <section data-slot="frame" className={cn('flex min-w-0 flex-col gap-2 rounded-lg bg-muted p-2', className)}>
      <header className="px-1.5 pt-1">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold">
          {tone ? <i data-tone={tone} className="size-2 rounded-full bg-tone" aria-hidden="true" /> : null}
          {title}
          <span className="font-mono font-medium text-muted-foreground">{count}</span>
          {points === undefined ? null : <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">{points} pt</span>}
        </div>
        {about ? <p className="mt-0.5 text-xs text-muted-foreground">{about}</p> : null}
        {chips ? <div className="mt-1.5 flex flex-wrap gap-1">{chips}</div> : null}
      </header>
      {children ? (
        <div className={layout === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2.5' : 'flex flex-col gap-2'}>{children}</div>
      ) : (
        <p className="grid min-h-16 place-items-center rounded-md px-2.5 py-3.5 text-center text-[12.5px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">{empty ?? 'Nothing here'}</p>
      )}
    </section>
  )
}
