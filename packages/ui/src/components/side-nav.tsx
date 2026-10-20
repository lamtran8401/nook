import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

export type NavItem = { label: string; href: string; icon: ReactNode; count?: number; active: boolean }

function NavLink({ item }: { item: NavItem }) {
  return (
    <a
      href={item.href}
      {...(item.active ? { 'aria-current': 'page' as const } : {})}
      className={cn(
        'flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-[18px] [&_svg]:shrink-0',
        item.active && 'bg-muted font-medium text-foreground',
      )}
    >
      {item.icon}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.count === undefined ? null : <span className="font-mono text-xs text-muted-foreground">{item.count}</span>}
    </a>
  )
}

/** The pages of a desk: its name, the search, one link for each page with its icon and count, and the footer links at the end. */
export function SideNav({ title, search, items, footer = [] }: { title: string; search?: ReactNode; items: NavItem[]; footer?: NavItem[] }) {
  return (
    <nav data-slot="side-nav" aria-label="Pages" className="flex w-60 shrink-0 flex-col gap-1 border-r border-hairline bg-card px-3 py-4">
      <p className="truncate px-2.5 pb-2 text-[15px] font-semibold">{title}</p>
      {search ? <div className="pb-2">{search}</div> : null}
      {items.map(item => (
        <NavLink key={item.href} item={item} />
      ))}
      {footer.length ? (
        <div className="mt-auto flex flex-col gap-1 pt-4">
          {footer.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      ) : null}
    </nav>
  )
}
