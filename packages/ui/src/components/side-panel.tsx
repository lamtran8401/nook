'use client'

import { XIcon } from 'lucide-react'
import { Dialog as PanelPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** A drawer of thick glass on the right of the page, such as the overview of an item beside the board. Escape and the scrim close it. */
function SidePanel(props: React.ComponentProps<typeof PanelPrimitive.Root>) {
  return <PanelPrimitive.Root data-slot="side-panel" {...props} />
}

function SidePanelContent({ className, children, label, ...props }: React.ComponentProps<typeof PanelPrimitive.Content> & { label: string }) {
  return (
    <PanelPrimitive.Portal>
      <PanelPrimitive.Overlay data-slot="side-panel-overlay" className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <PanelPrimitive.Content
        data-slot="side-panel-content"
        aria-describedby={undefined}
        className={cn(
          'fixed top-2.5 right-2.5 bottom-2.5 z-50 flex w-[min(640px,calc(100%-20px))] flex-col overflow-hidden rounded-[14px] bg-[var(--glass-strong)] shadow-lg backdrop-blur-xl backdrop-saturate-150 outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right-4',
          className,
        )}
        {...props}
      >
        <PanelPrimitive.Title className="sr-only">{label}</PanelPrimitive.Title>
        {children}
      </PanelPrimitive.Content>
    </PanelPrimitive.Portal>
  )
}

function SidePanelHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return <header data-slot="side-panel-header" className={cn('border-b border-[var(--hairline)] px-[22px] pt-4 pb-3', className)} {...props} />
}

function SidePanelBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="side-panel-body" className={cn('min-h-0 flex-1 overflow-auto px-[22px] pt-1 pb-5', className)} {...props} />
}

function SidePanelFooter({ className, ...props }: React.ComponentProps<'footer'>) {
  return <footer data-slot="side-panel-footer" className={cn('flex flex-wrap items-center gap-2 border-t border-[var(--hairline)] px-[22px] py-3', className)} {...props} />
}

function SidePanelClose({ className, ...props }: React.ComponentProps<typeof PanelPrimitive.Close>) {
  return (
    <PanelPrimitive.Close data-slot="side-panel-close" aria-label="Close" className={cn('grid size-[30px] place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground', className)} {...props}>
      <XIcon className="size-4" aria-hidden="true" />
    </PanelPrimitive.Close>
  )
}

export { SidePanel, SidePanelBody, SidePanelClose, SidePanelContent, SidePanelFooter, SidePanelHeader }
