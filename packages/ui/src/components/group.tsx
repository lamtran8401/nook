import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

const HEAD = 'flex min-w-0 items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground [overflow-wrap:anywhere]'

/**
 * A card of lines under one head: the head names what the lines are about, and links to it when `href` is given.
 * `indent` sets the lines under the head, as the parts of one thing.
 */
export function Group({ head, href, indent, className, children }: { head: ReactNode; href?: string | undefined; indent?: boolean; className?: string; children: ReactNode }) {
  return (
    <div data-slot="group" className={cn('overflow-hidden rounded-lg bg-card shadow-sm', className)}>
      {href ? <a href={href} className={cn(HEAD, 'hover:bg-muted/50')}>{head}</a> : <div className={HEAD}>{head}</div>}
      <ul data-indent={indent ? 'true' : undefined} className="group/lines divide-y divide-hairline border-t border-hairline">
        {children}
      </ul>
    </div>
  )
}

/** One line of a group: a mark on the left, the words, and an end such as a button or a tag. */
export function GroupLine({ mark, end, children }: { mark?: ReactNode; end?: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-start gap-2.5 px-4 py-2.5 group-data-[indent=true]/lines:pl-10">
      <span className="flex h-5 items-center text-muted-foreground">{mark}</span>
      <div className="grid min-w-0 justify-items-start gap-1.5 text-sm">{children}</div>
      {end ?? <span />}
    </li>
  )
}

/** The number of lines, in the head of a group. */
export function GroupCount({ n }: { n: number }) {
  return <span className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] leading-[18px] font-semibold text-muted-foreground">{n}</span>
}
