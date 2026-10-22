import type { MouseEventHandler, ReactNode } from 'react'

/**
 * One item on the board, lean: the kind icon, the id, the points, the mode and the areas on one line, the title, the
 * bar of the steps, then one line of what happens next with its end, such as the slices. A card that waits for the
 * owner has a red ring; the card whose drawer is open has the blue one. The dot of `flagTone` says who holds the next
 * move. `onClick` lets the app open the drawer.
 */
export function ItemCard({ href, kind, id, points, mode, areas, title, steps, flag, flagTone, end, needs = false, selected = false, onClick }: {
  href: string
  kind: ReactNode
  id: string
  points?: number | null
  mode?: ReactNode
  areas: string[]
  title: string
  steps: ReactNode
  flag?: ReactNode
  flagTone?: string
  end?: ReactNode
  needs?: boolean
  selected?: boolean
  onClick?: MouseEventHandler<HTMLAnchorElement>
}) {
  return (
    <a
      data-slot="item-card"
      href={href}
      onClick={onClick}
      data-needs={needs}
      data-selected={selected}
      className="flex flex-col gap-[7px] rounded-md bg-surface px-3 py-2.5 text-left shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[needs=true]:shadow-[0_0_0_1px_color-mix(in_oklch,var(--danger)_35%,transparent),0_4px_14px_-6px_color-mix(in_oklch,var(--danger)_35%,transparent)] data-[selected=true]:bg-primary-subtle data-[selected=true]:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent),0_4px_14px_-6px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
    >
      <span className="flex items-center gap-1.5 text-xs text-faint">
        {kind}
        <span className="font-mono">{id}</span>
        {points === null || points === undefined ? null : <span className="rounded-full bg-muted px-1.5 font-mono text-[11px] leading-[18px] text-muted-foreground">{points} pt</span>}
        {mode}
        <span className="ml-auto whitespace-nowrap">{areas.join(' · ')}</span>
      </span>
      <span className="text-[13.5px] leading-[1.35] font-medium text-foreground">{title}</span>
      {steps}
      {flag || end ? (
        <span className="flex min-w-0 items-center gap-1.5 text-xs">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground">
            {flagTone ? <i data-tone={flagTone} className="size-2 shrink-0 rounded-full bg-tone" aria-hidden="true" /> : null}
            <span className="truncate">{flag}</span>
          </span>
          {end ? <span className="flex shrink-0 items-center gap-1.5 font-mono text-muted-foreground">{end}</span> : null}
        </span>
      ) : null}
    </a>
  )
}
