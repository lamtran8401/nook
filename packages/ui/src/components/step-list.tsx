import type { ReactNode } from 'react'

export type StepItem = { title: ReactNode; text?: ReactNode }

/** Steps in order, a number before each; `path` joins the numbers with a line, as the steps of a walk. */
export function StepList({ items, variant = 'numbered' }: { items: StepItem[]; variant?: 'numbered' | 'path' }) {
  return (
    <ol data-slot="step-list" data-variant={variant} className="group/steps grid gap-3">
      {items.map((item, i) => (
        <li key={i} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 text-[13.5px]">
          {variant === 'path' && i < items.length - 1 ? <span aria-hidden="true" className="absolute top-7 bottom-[-12px] left-[11px] w-0.5 bg-border" /> : null}
          <span className="relative grid size-6 place-items-center rounded-full bg-primary-subtle font-mono text-[11px] font-semibold text-primary">{i + 1}</span>
          <div className="min-w-0 pt-0.5">
            <div className={item.text ? 'font-semibold' : undefined}>{item.title}</div>
            {item.text ? <div className="text-[13px] text-muted-foreground">{item.text}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
