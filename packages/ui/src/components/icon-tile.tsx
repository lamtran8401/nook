import type { ReactNode } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

const SIZE = {
  md: 'size-9 rounded-[12px] bg-tone-subtle text-sm font-bold text-tone',
  sm: 'size-4 rounded-full bg-tone text-[10px] font-extrabold text-surface',
  xs: 'size-4 rounded-[4px] bg-tone text-surface',
} as const

/** A mark in a tile of its tone: the icon of a row, a kind, an urgent line. A `label` names it for a reader of the screen. */
export function IconTile({ tone = 'neutral', size = 'md', label, className, children }: { tone?: string; size?: keyof typeof SIZE; label?: string; className?: string; children: ReactNode }) {
  return (
    <span data-slot="icon-tile" data-tone={tone} {...(label ? { role: 'img', 'aria-label': label } : {})} className={cn('inline-grid shrink-0 place-items-center leading-none', SIZE[size], className)}>
      {children}
    </span>
  )
}
