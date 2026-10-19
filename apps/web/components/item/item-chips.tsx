import type { ReactNode } from 'react'

import type { Item } from '@nook/engineering/stores/items.ts'
import { Badge } from '@nook/ui/components/badge.tsx'

import { AreaTags } from '@/components/areas.tsx'
import { KindIcon, StateTag } from '@/components/marks.tsx'

/** The chips of an item, in its page head and in its dialog: state, kind, size and areas; `children` add to the row. */
export function ItemChips({ item, children }: { item: Pick<Item, 'state' | 'kind' | 'size' | 'areas'>; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StateTag state={item.state} />
      <Badge variant="outline">
        <KindIcon kind={item.kind} />
        {item.kind}
      </Badge>
      <Badge variant="outline">size {item.size}</Badge>
      <AreaTags names={item.areas} />
      {children}
    </div>
  )
}
