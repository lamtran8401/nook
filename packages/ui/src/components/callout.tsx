import type { ReactNode } from 'react'

/** A note in one tone: an icon, a label and a body, such as In short or Need to know. */
export function Callout({ tone, icon, label, children }: { tone: string; icon: ReactNode; label: ReactNode; children?: ReactNode }) {
  return (
    <div role="note" data-slot="callout" data-tone={tone} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-md bg-tone-subtle p-4 ring-1 ring-tone/20 ring-inset">
      <span className="grid size-6 place-items-center rounded-full bg-tone text-xs font-bold text-surface">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-tone">{label}</p>
        {children ? <div className="mt-1 text-[15px] leading-6">{children}</div> : null}
      </div>
    </div>
  )
}
