import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export type ListLink = { href: string; icon: ReactNode; title: string; description: string; current?: boolean }

/** Links as small cards, one under the other: an icon, a title in mono, one muted line, and an arrow. */
export function LinkList({ links, label }: { links: ListLink[]; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-col gap-1.5">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          {...(link.current ? { 'aria-current': 'page' as const } : {})}
          className="flex items-center gap-2.5 rounded-md bg-surface px-2.5 py-2 shadow-xs outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-primary-subtle"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-muted text-muted-foreground [&_svg]:size-3.5">{link.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[12.5px] font-semibold">{link.title}</span>
            <span className="block text-xs leading-4 text-muted-foreground">{link.description}</span>
          </span>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </a>
      ))}
    </nav>
  )
}
