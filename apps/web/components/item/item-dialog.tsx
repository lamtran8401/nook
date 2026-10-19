import { Check } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

import type { ItemView } from '@nook/engineering/read/reader.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { Progress } from '@nook/ui/components/progress.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { Criteria } from '@/components/criteria.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { NextStep } from '@/components/item/next-step.tsx'
import { SliceBoard } from '@/components/item/slice-board.tsx'
import { KindIcon, StateTag } from '@/components/marks.tsx'
import { keyMoments } from '@/lib/moments.ts'
import { clock, day } from '@/lib/time.ts'

const ACTIVITY = 12
const HEADING = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</dd>
    </>
  )
}

function Share({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{done}/{total}</span>
      </div>
      <Progress value={total ? (100 * done) / total : 0} className="h-1.5" />
    </div>
  )
}

/**
 * An item in a dialog over the board, as Jira opens an issue: a head with the way back and the full page, a main
 * column with the title, the next step, the criteria, the slices and the activity, and the details beside it.
 */
export function ItemDialog({ view }: { view: ItemView }) {
  const { item } = view
  const { started, approved, sentBack } = keyMoments(view.moves)
  const slices = view.slices.filter(s => s.state !== 'cancelled')
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-hairline py-3 pr-14 pl-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <a href="/works" className="hover:text-foreground">Works</a>
          <span aria-hidden="true">/</span>
          <span className="font-mono text-foreground">{item.id}</span>
        </nav>
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <a href={`/works/${item.id}`} target="_blank" rel="noopener">
            <ExternalLink aria-hidden="true" />
            Open in new tab
          </a>
        </Button>
      </header>
      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_300px] md:overflow-hidden">
        <div className="space-y-6 px-6 py-5 md:min-h-0 md:overflow-y-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">{item.title}</h2>
          <NextStep next={view.next} />
          <section className="space-y-3">
            <h3 className={HEADING}>Criteria</h3>
            {view.criteria.length ? <Criteria criteria={view.criteria} /> : <EmptyState compact icon={<Check className="size-5" aria-hidden="true" />} title="No criteria yet">The spec step writes them.</EmptyState>}
          </section>
          <section className="space-y-3">
            <h3 className={HEADING}>Slices</h3>
            <SliceBoard slices={view.slices} />
          </section>
          <section className="space-y-3">
            <h3 className={HEADING}>Activity</h3>
            <ol className="space-y-3">
              {view.events.slice(-ACTIVITY).reverse().map(e => (
                <li key={`${e.at}${e.title}`} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 text-sm">
                  <span className="font-mono text-xs leading-5 text-muted-foreground">{day(e.at)} {clock(e.at)}</span>
                  <span>
                    {e.title}
                    {e.text ? <span className="text-muted-foreground"> · {e.text}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="space-y-5 border-t border-hairline bg-muted/40 px-5 py-6 md:min-h-0 md:overflow-y-auto md:border-t-0 md:border-l">
          <h3 className={HEADING}>Details</h3>
          <dl className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-sm">
            <Detail label="State"><StateTag state={item.state} /></Detail>
            <Detail label="Kind"><KindIcon kind={item.kind} />{item.kind}</Detail>
            <Detail label="Size">{item.size}</Detail>
            <Detail label="Areas"><AreaTags names={item.areas} /></Detail>
            <Detail label="Mode">{item.mode}</Detail>
            {started ? <Detail label="Started">{day(started)}</Detail> : null}
            {approved ? <Detail label="Approved">{day(approved)} {clock(approved)}</Detail> : null}
            {sentBack ? <Detail label="Sent back">{sentBack}×</Detail> : null}
          </dl>
          <div className="space-y-4">
            <Share label="Criteria met" done={view.criteria.filter(c => c.done).length} total={view.criteria.length} />
            <Share label="Slices done" done={slices.filter(s => s.state === 'done').length} total={slices.length} />
          </div>
        </aside>
      </div>
    </div>
  )
}
