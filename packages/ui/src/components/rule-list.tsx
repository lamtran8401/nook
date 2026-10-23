import { Check, Clock } from 'lucide-react'
import type { ReactNode } from 'react'

export type Rule = { label: ReactNode; content: ReactNode; tone?: string | undefined; end?: ReactNode }

/**
 * The rules of a document as rows: a small tile, a check for a rule that rests on a settled source and a clock in
 * the tone of an open one, the rule, its words, and its sources on the right.
 */
export function RuleList({ rules }: { rules: Rule[] }) {
  return (
    <ul data-slot="rule-list" className="divide-y divide-hairline">
      {rules.map((rule, i) => (
        <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-3 py-2.5">
          <span data-tone={rule.tone ?? 'violet'} className="mt-px grid size-[22px] place-items-center rounded-sm bg-tone-subtle text-tone" aria-hidden="true">
            {rule.tone ? <Clock className="size-3" /> : <Check className="size-3" strokeWidth={2.5} />}
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold">{rule.label}</p>
            <p className="text-[13px] leading-5 text-muted-foreground">{rule.content}</p>
          </div>
          <span className="flex flex-wrap justify-end gap-1">{rule.end}</span>
        </li>
      ))}
    </ul>
  )
}
