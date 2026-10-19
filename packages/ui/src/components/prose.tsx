import type { ComponentProps } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

/** The body of a document: the rhythm between its blocks, its headings, and its own lists and links. */
export function Prose({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="prose"
      className={cn(
        'grid min-w-0 gap-4 text-[15.5px] leading-[25px]',
        '[&>h2]:mt-5 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:tracking-tight [&>h3]:mt-3 [&>h3]:text-base [&>h3]:font-semibold [&>:is(h2,h3)+*]:-mt-1.5',
        '[&_:is(ul,ol):not([data-slot])]:pl-[1.3em] [&_ul:not([data-slot])]:list-disc [&_ol:not([data-slot])]:list-decimal [&_li:not([data-slot])+li]:mt-1.5',
        '[&_a]:text-primary [&_a]:underline-offset-3 [&_a:hover]:underline [&_hr]:border-border',
        className,
      )}
      {...props}
    />
  )
}
