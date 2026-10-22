import type { ComponentProps } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** The body of a document: the rhythm between its blocks, its headings, and its own lists and links. */
export function Prose({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="prose"
      className={cn(
        'grid min-w-0 gap-3 text-[14px] leading-[22px]',
        '[&>h2]:mt-4 [&>h2]:text-[14.5px] [&>h2]:font-semibold [&>h3]:mt-2 [&>h3]:text-[13.5px] [&>h3]:font-semibold [&>:is(h2,h3)+*]:-mt-1',
        '[&_:is(ul,ol):not([data-slot])]:pl-[1.3em] [&_ul:not([data-slot])]:list-disc [&_ol:not([data-slot])]:list-decimal [&_li:not([data-slot])+li]:mt-1.5',
        '[&_a]:text-primary [&_a]:underline-offset-3 [&_a:hover]:underline [&_hr]:border-border',
        className,
      )}
      {...props}
    />
  )
}
