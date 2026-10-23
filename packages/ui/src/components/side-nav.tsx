import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

export type NavItem = { label: string; href: string; icon: ReactNode; count?: number; active: boolean }

function NavLink({ item }: { item: NavItem }) {
  return (
    <a
      href={item.href}
      {...(item.active ? { 'aria-current': 'page' as const } : {})}
      className={cn(
        'flex items-center gap-2.5 rounded-full px-3 py-[6px] text-[14px] text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0',
        item.active && 'bg-surface font-medium text-foreground shadow-xs',
      )}
    >
      {item.icon}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.count === undefined ? null : <span className="font-mono text-[11px] text-faint">{item.count}</span>}
    </a>
  )
}

/**
 * The sidebar of a workspace: its head (the workspace menu), the search, one link for each page with its icon and count, and the
 * footer links at the end. It sits flat on the ground; the current page is a raised pill.
 */
export function SideNav({ head, search, items, footer = [] }: { head: ReactNode; search?: ReactNode; items: NavItem[]; footer?: NavItem[] }) {
  return (
    <nav data-slot="side-nav" aria-label="Pages" className="flex h-full flex-col gap-0.5 px-2.5 py-3">
      <div className="mb-2 flex items-center gap-1">{head}</div>
      {search ? <div className="mb-2.5">{search}</div> : null}
      {items.map(item => (
        <NavLink key={item.href} item={item} />
      ))}
      {footer.length ? (
        <div className="mt-auto flex flex-col gap-0.5 pt-4">
          {footer.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      ) : null}
    </nav>
  )
}
