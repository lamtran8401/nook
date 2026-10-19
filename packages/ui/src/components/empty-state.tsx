import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

/** A place with nothing in it yet: what is missing, and what fills it. `compact` fits inside a section. */
export function EmptyState({ icon, title, children, compact = false }: { icon: ReactNode; title: string; children?: ReactNode; compact?: boolean }) {
  return (
    <Card data-size={compact ? 'compact' : undefined} className="items-center gap-3 bg-muted/70 px-6 py-10 text-center shadow-none data-[size=compact]:flex-row data-[size=compact]:px-5 data-[size=compact]:py-4 data-[size=compact]:text-left">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-surface text-muted-foreground shadow-sm">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {children ? <p className="mt-0.5 text-sm text-muted-foreground">{children}</p> : null}
      </div>
    </Card>
  )
}
