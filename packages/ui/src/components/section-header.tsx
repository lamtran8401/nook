import type { ReactNode } from 'react'

/** The head of a section: its title with a count, and its tools, such as the filters, on the right. */
export function SectionHeader({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div data-slot="section-header" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 className="flex items-baseline gap-2 text-[19px] font-semibold">
        {title}
        {count === undefined ? null : <span className="text-[17px] font-medium text-muted-foreground">{count}</span>}
      </h2>
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}
