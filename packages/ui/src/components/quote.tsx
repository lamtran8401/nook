import type { ReactNode } from 'react'

/** A quote set apart in a frame. */
export function Quote({ children }: { children: ReactNode }) {
  return (
    <figure data-slot="quote" className="m-0 rounded-xl border border-border bg-surface p-6">
      <blockquote className="m-0 grid gap-3 text-lg leading-7 font-medium">{children}</blockquote>
    </figure>
  )
}
