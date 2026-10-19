import type { ReactNode } from 'react'

import type { Item } from '@nook/engineering/stores/items.ts'

import { AreaTags } from '@/components/Areas.tsx'
import { KindIcon, StateTag } from '@/components/Marks.tsx'

/** The chips of an item, in its page head and in its dialog: state, kind, size and areas; `children` add to the row. */
export function ItemChips({ item, children }: { item: Pick<Item, 'state' | 'kind' | 'size' | 'areas'>; children?: ReactNode }) {
  return (
    <div className="nk-chips">
      <StateTag state={item.state} />
      <span className="nk-kindlabel">
        <KindIcon kind={item.kind} />
        {item.kind}
      </span>
      <span className="bn-badge" data-variant="plain">size {item.size}</span>
      <AreaTags names={item.areas} />
      {children}
    </div>
  )
}
