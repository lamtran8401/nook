'use client'

import { Check } from 'lucide-react'
import { DropdownMenu as MenuPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** A menu that floats over the page, such as the desk menu or the Display menu of the board: thick glass, items as soft rows. */
function Menu(props: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="menu" {...props} />
}

function MenuTrigger(props: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
}

function MenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[220px] rounded-[14px] bg-[var(--glass-strong)] p-1.5 text-foreground shadow-lg backdrop-blur-xl backdrop-saturate-150 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

const itemLook = 'flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-sm outline-none select-none data-[highlighted]:bg-surface data-[highlighted]:shadow-xs data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

function MenuItem({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Item>) {
  return <MenuPrimitive.Item data-slot="menu-item" className={cn(itemLook, className)} {...props} />
}

function MenuLabel({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label data-slot="menu-label" className={cn('px-2 pt-1.5 pb-1 text-[11.5px] font-semibold text-muted-foreground', className)} {...props} />
}

function MenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator data-slot="menu-separator" className={cn('mx-1 my-1.5 h-px bg-[var(--hairline)]', className)} {...props} />
}

function MenuRadioGroup(props: React.ComponentProps<typeof MenuPrimitive.RadioGroup>) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />
}

/** One choice of a group, such as Phase or Who holds it: the chosen one shows a check at the end. */
function MenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem data-slot="menu-radio-item" className={cn(itemLook, className)} {...props}>
      <span className="min-w-0 flex-1">{children}</span>
      <MenuPrimitive.ItemIndicator className="text-primary">
        <Check className="size-3.5" aria-hidden="true" />
      </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.RadioItem>
  )
}

export { Menu, MenuContent, MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger }
