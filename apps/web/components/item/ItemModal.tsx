'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { Dialog, DialogContent, DialogTitle } from '@nook/ui/components/dialog.tsx'

/** The item over the board in a dialog of 80% of the screen; Escape, the close button or a click outside goes back. */
export function ItemModal({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <Dialog open onOpenChange={open => (open ? undefined : router.back())}>
      <DialogContent aria-describedby={undefined} className="flex h-[85vh] w-[80vw] max-w-none flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none max-md:h-dvh max-md:w-screen max-md:rounded-none">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}
