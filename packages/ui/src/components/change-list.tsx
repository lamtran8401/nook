import { GitBranch } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'
import { IconTile } from '@nook/ui/components/icon-tile.tsx'

export type Change = { key: string; tone?: string | undefined; head: ReactNode; files: number; add: number; del: number; end?: ReactNode }

/** The changes of each branch: its head, its files, the lines added and removed with a bar of the two, and its checks. */
export function ChangeList({ changes }: { changes: Change[] }) {
  return (
    <Card className="gap-0 px-5 py-0">
      <ul className="divide-y divide-hairline">
        {changes.map(change => {
          const total = change.add + change.del
          return (
            <li key={change.key} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 py-3">
              <IconTile tone={change.tone ?? 'neutral'}>
                <GitBranch className="size-[17px]" aria-hidden="true" />
              </IconTile>
              <div className="grid min-w-0 gap-1.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">{change.head}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span><b className="font-semibold text-foreground">{change.files}</b> files</span>
                  {change.add ? <span className="font-mono text-success">+{change.add}</span> : null}
                  {change.del ? <span className="font-mono text-danger">−{change.del}</span> : null}
                  {total ? (
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-danger/70" aria-hidden="true">
                      <span className="block h-full bg-success" style={{ width: `${Math.round((change.add / total) * 100)}%` }} />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">{change.end}</div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
