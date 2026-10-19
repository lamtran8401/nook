import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

/** A bar that says what comes next: a small label, a mark, the words and the action at its end. */
export function ActionBar({ label, mark, action, children }: { label: string; mark?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex-row flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      {mark}
      <div className="grid min-w-0 flex-1 justify-items-start gap-1">{children}</div>
      {action}
    </Card>
  )
}
