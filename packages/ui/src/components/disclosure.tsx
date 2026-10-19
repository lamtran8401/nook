'use client'

import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@nook/ui/components/collapsible.tsx'

/** A part that opens on a click, on the collapsible of the kit; its words stay in the page while it is closed. */
export function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <Collapsible className="group/disclosure border-t border-border pt-2.5">
      <CollapsibleTrigger className="flex cursor-pointer items-center gap-1.5 text-[13.5px] font-semibold">
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]/disclosure:rotate-90" aria-hidden="true" />
        {summary}
      </CollapsibleTrigger>
      <CollapsibleContent forceMount className="mt-3 data-[state=closed]:hidden">{children}</CollapsibleContent>
    </Collapsible>
  )
}
