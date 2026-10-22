import type { MouseEventHandler, ReactNode } from 'react'

/**
 * One row of the inbox: the dot of its tone, the id, the title with one line under it, and its actions on the first
 * line; `below` holds a part that acts in place, such as an answer box. The row that a key acts on has the blue ring.
 */
export function InboxRow({ tone, id, title, sub, actions, below, selected = false, onClick }: {
  tone: string
  id?: string
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
  below?: ReactNode
  selected?: boolean
  onClick?: MouseEventHandler<HTMLLIElement>
}) {
  return (
    <li
      data-slot="inbox-row"
      data-selected={selected}
      onClick={onClick}
      className="grid grid-cols-[10px_68px_minmax(0,1fr)] items-start gap-x-3 rounded-xl px-3 py-2.5 data-[selected=true]:bg-primary-subtle data-[selected=true]:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)] max-sm:grid-cols-[10px_minmax(0,1fr)]"
    >
      <i data-tone={tone} className="mt-[7px] size-2 rounded-full bg-tone" aria-hidden="true" />
      <span className="pt-0.5 font-mono text-xs text-muted-foreground max-sm:hidden">{id}</span>
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">{title}</p>
            {sub ? <p className="text-[12.5px] text-muted-foreground">{sub}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </div>
        {below}
      </div>
    </li>
  )
}
