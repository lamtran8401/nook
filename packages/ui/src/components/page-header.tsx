import type { ReactNode } from 'react'

/** The head of a page: its title, one line on its use, and its actions on the right. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header data-slot="page-header" className="flex flex-wrap items-start gap-x-6 gap-y-2">
      <div className="min-w-0 flex-1">
        <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.01em] text-balance">{title}</h1>
        {description ? <p className="mt-0.5 text-[14px] text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
