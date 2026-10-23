import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

type HeadProps = { title: string; tone?: string; count: number; points?: number; about?: string; chips?: ReactNode; folded?: boolean }

function FrameHead({ title, tone, count, points, about, chips, folded }: HeadProps) {
  return (
    <>
      <div className="flex items-center gap-2 text-[13.5px] font-semibold">
        {folded ? <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open/frame:rotate-90" aria-hidden="true" /> : null}
        {tone ? <i data-tone={tone} className="size-2 rounded-full bg-tone" aria-hidden="true" /> : null}
        {title}
        <span className="font-medium text-faint">{count}</span>
        {points === undefined ? null : <span className="ml-auto font-mono text-xs font-normal text-faint">{points} pt</span>}
      </div>
      {about ? <p className={cn('mt-0.5 text-xs text-muted-foreground', folded && 'pl-5.5')}>{about}</p> : null}
      {chips ? <div className="mt-1.5 flex flex-wrap gap-1">{chips}</div> : null}
    </>
  )
}

/**
 * A group of cards on a muted ground, such as a phase of the board or the backlog: a header with its dot, title, count,
 * points and one line on its use, then the cards in a column or a grid. With no card it says what is empty.
 * A folded frame starts shut as one strip, and its header opens it.
 */
export function Frame({ layout = 'column', empty, folded = false, children, className, ...head }: HeadProps & {
  layout?: 'column' | 'grid'
  empty?: string
  children?: ReactNode
  className?: string
}) {
  const body = children ? (
    <div className={layout === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2.5' : 'flex flex-col gap-2'}>{children}</div>
  ) : (
    <p className="grid min-h-16 place-items-center rounded-md px-2.5 py-3.5 text-center text-[12.5px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">{empty ?? 'Nothing here'}</p>
  )
  const frame = cn('flex min-w-0 flex-col gap-2 rounded-lg bg-muted p-2', className)
  if (folded) {
    return (
      <details data-slot="frame" className={cn('group/frame', frame, 'gap-0 open:gap-2')}>
        <summary className="cursor-pointer list-none rounded-md px-1.5 py-1 [&::-webkit-details-marker]:hidden">
          <FrameHead {...head} folded />
        </summary>
        {body}
      </details>
    )
  }
  return (
    <section data-slot="frame" className={frame}>
      <header className="px-1.5 pt-1">
        <FrameHead {...head} />
      </header>
      {body}
    </section>
  )
}
