import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@nook/ui/components/navigation-menu.tsx'
import { cn } from '@nook/ui/lib/utils.ts'

export type LinkTab = { href: string; label: string; current?: boolean }

const TAB = 'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent data-[active]:bg-surface data-[active]:text-foreground data-[active]:shadow-sm data-[active]:hover:bg-surface'

/**
 * Links between pages as tabs, on the navigation menu of the kit: the current one is marked, and the arrow keys move
 * between them. `pills` is the light row of the top bar; `bar` is the glass bar of a page; `segment` is a small row
 * of choices on a muted track, such as the kinds of the board.
 */
export function LinkTabs({ tabs, label, variant = 'pills' }: { tabs: LinkTab[]; label: string; variant?: 'pills' | 'bar' | 'segment' }) {
  return (
    // Radix wraps the list in a div; letting it shrink is what makes a long row scroll instead of widening the page
    <NavigationMenu viewport={false} aria-label={label} className="max-w-full flex-none justify-start [&>div]:min-w-0">
      <NavigationMenuList className={cn('justify-center-safe gap-1 overflow-x-auto [scrollbar-width:none]', variant === 'bar' && 'rounded-full bg-muted/55 p-1 ring-1 ring-hairline backdrop-blur-md backdrop-saturate-[1.8]', variant === 'segment' && 'gap-0.5 rounded-full bg-muted p-0.5')}>
        {tabs.map(tab => (
          <NavigationMenuItem key={tab.href}>
            <NavigationMenuLink asChild active={tab.current} className={cn(TAB, variant === 'bar' && 'h-[30px] px-3.5 text-[13.5px]', variant === 'segment' && 'h-7 px-3 text-[12.5px] data-[active]:shadow-xs')}>
              <a href={tab.href}>{tab.label}</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
