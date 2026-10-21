import type { ItemView } from '@nook/engineering/read/reader.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { StepBar } from '@nook/ui/components/step-bar.tsx'

import { KindIcon } from '@/components/marks.tsx'
import { FLOW } from '@/lib/board.ts'

/** The place of an item on the flow: a blocked or cancelled item keeps the last step of the flow that it reached. */
function stepAt(view: ItemView): number {
  const at = FLOW.indexOf(view.item.state as (typeof FLOW)[number])
  if (at >= 0) return at
  return view.moves.map(move => FLOW.indexOf(move.to as (typeof FLOW)[number])).filter(i => i >= 0).at(-1) ?? 0
}

export function ModeChip({ mode }: { mode: string }) {
  return mode === 'yolo' ? <Badge tone="warning">yolo</Badge> : <Badge variant="outline">normal</Badge>
}

/** One line of the facts of an item: its id, step, kind, points and mode. */
export function ItemLine({ item }: { item: ItemView['item'] }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-mono">{item.id}</span>·<span>{item.state}</span>·
      <span className="flex items-center gap-1">
        <KindIcon kind={item.kind} />
        {item.kind}
      </span>
      {item.points === null ? null : <Badge variant="outline" className="tabular-nums">{item.points} pt</Badge>}
      <ModeChip mode={item.mode} />
    </p>
  )
}

export const ItemSteps = ({ view }: { view: ItemView }) => <StepBar count={FLOW.length} at={stepAt(view)} finished={view.item.state === 'done'} labels={FLOW} />

/** The head of an item page: its line of facts, the title, the command the lead runs next, and the steps of the flow. */
export function ItemHead({ view }: { view: ItemView }) {
  const { item, next } = view
  return (
    <header className="grid gap-3">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ItemLine item={item} />
          <h1 className="mt-1 text-[26px] leading-[34px] font-bold tracking-tight text-balance">{item.title}</h1>
        </div>
        {next.owner ? null : <CopyCommand text={next.skill} />}
      </div>
      <ItemSteps view={view} />
    </header>
  )
}
