import type * as React from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** The key that runs an action, such as A on Approve or ⌘K on the search box. In an ink button it takes the colour of the words. */
export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[6px] bg-muted px-[5px] font-mono text-[11px] font-medium text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]', className)}
      {...props}
    />
  )
}
