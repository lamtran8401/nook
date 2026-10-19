import type { ReactNode } from 'react'

import { IconTile } from '@nook/ui/components/icon-tile.tsx'

/** A list of things to act on, each a row with its mark, its words and its action. */
export function ActionList({ children }: { children: ReactNode }) {
  return <ul data-slot="action-list" className="divide-y divide-hairline">{children}</ul>
}

/** One thing to act on: a mark in its tone, the title, a note under it, and the action, level with the first line. */
export function ActionRow({ tone, icon, title, note, act, children }: { tone: string; icon: ReactNode; title: ReactNode; note?: ReactNode; act?: ReactNode; children?: ReactNode }) {
  return (
    <li className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 py-3.5">
      <IconTile tone={tone}>{icon}</IconTile>
      <div className="min-w-0 pt-1.5">
        <p className="text-[15px] leading-6 font-semibold">{title}</p>
        {note ? <p className="mt-0.5 text-sm text-muted-foreground">{note}</p> : null}
        {children}
      </div>
      {act ? <div className="mt-1 flex items-center gap-1.5">{act}</div> : <span />}
    </li>
  )
}

/** The small heading of a part of a list, with its count. */
export function ListHeading({ children }: { children: ReactNode }) {
  return <h3 className="flex items-center gap-2 pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</h3>
}
