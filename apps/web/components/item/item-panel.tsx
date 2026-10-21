import { ExternalLink } from 'lucide-react'

import type { ItemDocs, ItemView } from '@nook/engineering/read/reader.ts'
import { Button } from '@nook/ui/components/button.tsx'
import { SidePanelBody, SidePanelClose, SidePanelFooter, SidePanelHeader } from '@nook/ui/components/side-panel.tsx'

import { GateBar } from '@/components/item/gate-bar.tsx'
import { ItemLine, ItemSteps } from '@/components/item/item-head.tsx'
import { Overview } from '@/components/item/overview.tsx'
import { ownerGate } from '@/lib/turn.ts'

/** What the drawer of an item holds: its facts, the title and the steps, the overview, and the moves of the owner at a gate. */
export function ItemPanel({ view, docs, now, base }: { view: ItemView; docs: ItemDocs; now: Date; base: string }) {
  const { item } = view
  return (
    <>
      <SidePanelHeader className="grid gap-2.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ItemLine item={item} />
          </div>
          <Button asChild variant="outline" size="sm">
            {/* a plain link loads the full page; the router would keep the drawer over the board */}
            <a href={`${base}/works/${item.id}`}>
              <ExternalLink aria-hidden="true" />
              Open page
            </a>
          </Button>
          <SidePanelClose />
        </div>
        <h2 className="text-[19px] leading-[26px] font-semibold text-balance">{item.title}</h2>
        <ItemSteps view={view} />
      </SidePanelHeader>
      <SidePanelBody className="grid content-start gap-3 pt-4">
        <Overview view={view} docs={docs} now={now} />
      </SidePanelBody>
      {ownerGate(view.next) ? (
        <SidePanelFooter>
          <GateBar next={view.next} />
        </SidePanelFooter>
      ) : null}
    </>
  )
}
