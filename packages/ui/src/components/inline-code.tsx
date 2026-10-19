import type { ComponentProps } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** A short piece of code in a line of words, such as a branch name or a field. */
export function InlineCode({ className, ...props }: ComponentProps<'code'>) {
  return <code data-slot="inline-code" className={cn('rounded-[6px] bg-muted px-1.5 py-0.5 font-mono text-[0.875em] ring-1 ring-border ring-inset', className)} {...props} />
}
