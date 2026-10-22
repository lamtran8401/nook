import type { ReactNode } from 'react'

/** A quote set apart in a frame. */
export function Quote({ children }: { children: ReactNode }) {
  return (
    <figure data-slot="quote" className="m-0 rounded-md bg-muted px-4 py-3">
      <blockquote className="m-0 grid gap-2 text-[14px] leading-[22px] font-medium">{children}</blockquote>
    </figure>
  )
}
