import type { ComponentProps } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

const VARIANT = {
  soft: 'h-5 rounded-full bg-tone-subtle px-2 text-xs font-semibold text-tone',
  solid: 'h-5 min-w-5 justify-center rounded-full bg-tone px-1.5 text-[10px] font-bold tracking-wide text-surface',
  outline: 'h-5 rounded-full px-2 text-xs font-semibold text-muted-foreground ring-1 ring-border ring-inset',
  label: 'rounded-[4px] bg-tone/12 px-1.5 text-[10.5px] leading-4 font-bold tracking-wide text-tone uppercase',
} as const

export type TagVariant = keyof typeof VARIANT

/** A short word in a tone: a state, a kind, an area, a count. `label` is the small square tag of an area. */
export function Tag({ tone = 'neutral', variant = 'soft', className, ...props }: ComponentProps<'span'> & { tone?: string; variant?: TagVariant }) {
  return <span data-slot="tag" data-tone={tone} data-variant={variant} className={cn('inline-flex shrink-0 items-center gap-1 whitespace-nowrap', VARIANT[variant], className)} {...props} />
}
