import { cn } from '@nook/ui/lib/utils.ts'

export type LinkTab = { href: string; label: string; current?: boolean }

/** Tabs that are links, as the packs of a desk or the documents of an item; the current one is marked. */
export function LinkTabs({ tabs, label, className }: { tabs: LinkTab[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn('flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]', className)}>
      {tabs.map(tab => (
        <a
          key={tab.href}
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground aria-[current=page]:bg-surface aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        >
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
