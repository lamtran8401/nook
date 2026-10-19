import type { ReactNode } from 'react'

/** The details of a thing, a label beside each value. */
export function DetailList({ children }: { children: ReactNode }) {
  return <dl data-slot="detail-list" className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-sm">{children}</dl>
}

export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</dd>
    </>
  )
}
