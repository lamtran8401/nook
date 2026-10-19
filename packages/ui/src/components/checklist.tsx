import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

export type ChecklistItem = { done: boolean; content: ReactNode }

/** Things to do or met: a round box, filled with a check when the thing is done. */
export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul data-slot="checklist" className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} data-state={item.done ? 'done' : 'open'} className="group/check flex items-start gap-2.5">
          <span className="mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-border-strong text-surface group-data-[state=done]/check:border-success group-data-[state=done]/check:bg-success">
            {item.done ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : null}
          </span>
          <div className="min-w-0">{item.content}</div>
        </li>
      ))}
    </ul>
  )
}
