export type TreeGroup = { title: string; href?: string; current?: boolean; links: { href: string; label: string; current?: boolean }[] }

/** A side list of groups and their links on a card, such as the shelves of a wiki and their pages; the open link is marked. */
export function TreeNav({ label, groups }: { label: string; groups: TreeGroup[] }) {
  return (
    <nav aria-label={label} className="grid content-start gap-3 rounded-lg bg-card p-2 shadow-sm">
      {groups.map(group => (
        <section key={group.title} className="grid gap-0.5">
          <h2 className="flex items-center justify-between px-2.5 pt-1 text-[11.5px] font-medium text-muted-foreground">
            {group.href ? (
              <a href={group.href} {...(group.current ? { 'aria-current': 'page' as const } : {})} className="hover:text-foreground aria-[current=page]:text-foreground">
                {group.title}
              </a>
            ) : (
              group.title
            )}
            <span className="font-mono">{group.links.length}</span>
          </h2>
          {group.links.map(link => (
            <a
              key={link.href}
              href={link.href}
              {...(link.current ? { 'aria-current': 'page' as const } : {})}
              className="truncate rounded-md px-2.5 py-1.5 text-[13px] hover:bg-muted/60 aria-[current=page]:bg-primary-subtle aria-[current=page]:font-medium aria-[current=page]:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
            >
              {link.label}
            </a>
          ))}
        </section>
      ))}
    </nav>
  )
}
