import { GitBranch } from 'lucide-react'

import type { AreaChange } from '@nook/engineering/read/reader.ts'
import type { CheckRun } from '@nook/engineering/stores/checks.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { ChangeList } from '@nook/ui/components/change-list.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { InlineCode } from '@nook/ui/components/inline-code.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { clock } from '@/lib/time.ts'

const toneOf = (runs: CheckRun[]) => (!runs.length ? undefined : runs.some(r => r.result === 'fail') ? 'danger' : 'success')

function Checks({ runs }: { runs: CheckRun[] }) {
  if (!runs.length) return <small className="text-[13px] text-muted-foreground">no check yet</small>
  const failed = runs.filter(r => r.result === 'fail').length
  const passed = runs.length - failed
  return (
    <>
      {failed ? <Badge tone="danger">{failed} failing</Badge> : null}
      {passed ? <Badge tone="success">{passed} pass</Badge> : null}
      <small className="font-mono text-xs text-muted-foreground">{clock(runs.map(r => r.at).sort().at(-1)!)}</small>
    </>
  )
}

/** The branch of each area of the item, its changed files and lines against the main branch, and its last checks. */
export function Branches({ changes, checks }: { changes: AreaChange[]; checks: CheckRun[] }) {
  if (!changes.length) return <EmptyState compact icon={<GitBranch className="size-5" aria-hidden="true" />} title="No branch yet">The build makes one for each area.</EmptyState>
  return (
    <ChangeList
      changes={changes.map(change => {
        const runs = checks.filter(c => c.area === change.area)
        return {
          key: change.area,
          tone: toneOf(runs),
          head: (
            <>
              <AreaTags names={[change.area]} />
              <InlineCode>{change.branch}</InlineCode>
            </>
          ),
          files: change.files.length,
          add: change.files.reduce((n, f) => n + f.add, 0),
          del: change.files.reduce((n, f) => n + f.del, 0),
          end: <Checks runs={runs} />,
        }
      })}
    />
  )
}
