import { Check, Clock } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@nook/ui/components/badge.tsx'

export type CriterionCard = { n: number; tag?: { text: string; tone: string }; content: ReactNode; meta?: ReactNode; state?: { text: string; tone: string; done: boolean } }

/** The criteria of a spec, one small card each: the mark of its state, its number and tag, its words, its sources, and its state. */
export function CriterionCards({ items }: { items: CriterionCard[] }) {
  return (
    <ol data-slot="criterion-cards" className="grid gap-1.5">
      {items.map(item => (
        <li key={item.n} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-3 rounded-md bg-surface px-3.5 py-2.5 shadow-xs">
          <span data-tone={item.state?.tone ?? 'neutral'} className="mt-px grid size-6 place-items-center rounded-full bg-tone-subtle text-tone" aria-hidden="true">
            {item.state?.done ? <Check className="size-3.5" strokeWidth={2.5} /> : <Clock className="size-3.5" />}
          </span>
          <div className="grid min-w-0 gap-1">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13.5px] leading-5 font-medium">
              <span className="font-mono text-[11.5px] font-normal text-muted-foreground">AC {item.n}</span>
              {item.tag ? <Badge tone={item.tag.tone}>{item.tag.text.toLowerCase()}</Badge> : null}
              <span className="min-w-0">{item.content}</span>
            </p>
            {item.meta ? <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">{item.meta}</div> : null}
          </div>
          {item.state ? <Badge tone={item.state.tone}>{item.state.text}</Badge> : <span />}
        </li>
      ))}
    </ol>
  )
}
