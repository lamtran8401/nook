import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'
import { IconTile } from '@nook/ui/components/icon-tile.tsx'

export type Rule = { label: ReactNode; content: ReactNode; tone?: string | undefined; end?: ReactNode }

/** The rules of a document: a § tile in the tone of the strongest source, the rule, its words and its sources. */
export function RuleList({ rules }: { rules: Rule[] }) {
  return (
    <Card className="gap-0 px-5 py-0">
      <ul className="divide-y divide-hairline">
        {rules.map((rule, i) => (
          <li key={i} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 py-3.5">
            <IconTile tone={rule.tone ?? 'neutral'}>§</IconTile>
            <div className="min-w-0 pt-1.5">
              <p className="font-semibold">{rule.label}</p>
              <p className="text-[15px] leading-6">{rule.content}</p>
            </div>
            <span className="mt-1.5 flex flex-wrap justify-end gap-1">{rule.end}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
