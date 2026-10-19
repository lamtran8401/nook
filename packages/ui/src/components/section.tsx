import type { ReactNode } from 'react'

/** A part of a page: its title, then what it holds. */
export function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-[19px] font-semibold">{title}</h2>
      {children}
    </section>
  )
}
