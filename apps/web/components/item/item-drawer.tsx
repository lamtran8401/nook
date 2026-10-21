'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { SidePanel, SidePanelContent } from '@nook/ui/components/side-panel.tsx'

/** The drawer of an item over the board; Escape, the close button or a click on the scrim goes back to the board. */
export function ItemDrawer({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <SidePanel open onOpenChange={open => (open ? undefined : router.back())}>
      <SidePanelContent label={label}>{children}</SidePanelContent>
    </SidePanel>
  )
}
