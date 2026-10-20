import { cn } from '@nook/ui/lib/utils.ts'

export type RailDesk = { name: string; href: string; tone: string; active: boolean }

/** The dark rail of the app: the mark of Nook, then one tile for each desk, the open one with a ring. */
export function AppRail({ desks }: { desks: RailDesk[] }) {
  return (
    <nav data-slot="app-rail" aria-label="Desks" className="flex w-16 shrink-0 flex-col items-center gap-2.5 bg-rail py-3">
      <span aria-hidden="true" className="mb-1.5 grid size-10 place-items-center rounded-[12px] bg-primary text-[17px] font-extrabold text-primary-foreground">
        N
      </span>
      {desks.map(desk => (
        <a
          key={desk.href}
          href={desk.href}
          aria-label={desk.name}
          {...(desk.active ? { 'aria-current': 'page' as const } : {})}
          data-tone={desk.tone}
          className={cn(
            'grid size-10 place-items-center rounded-[12px] bg-rail-tile text-[13px] font-bold text-tone-subtle transition-colors hover:bg-tone hover:text-surface',
            desk.active && 'bg-tone text-surface ring-2 ring-surface ring-offset-2 ring-offset-rail',
          )}
        >
          {desk.name.slice(0, 2).toUpperCase()}
        </a>
      ))}
    </nav>
  )
}
