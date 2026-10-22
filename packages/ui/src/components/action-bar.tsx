import type { ReactNode } from 'react'

/** A card that says what comes next: a round mark, a small label over the words, and the action at its end. */
export function ActionBar({ label, mark, action, children }: { label: string; mark?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section data-slot="action-bar" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-card px-4 py-3 shadow-sm sm:flex-nowrap">
      {mark ? <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-semibold text-muted-foreground">{mark}</span> : null}
      <div className="grid min-w-0 flex-1 justify-items-start gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {children}
      </div>
      {action}
    </section>
  )
}
