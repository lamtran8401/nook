import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/** What stays out: each thing with a cross before it. */
export function OutList({ items }: { items: ReactNode[] }) {
  return (
    <ul data-slot="out-list" className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
          <X className="mt-[5px] size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}
