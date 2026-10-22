import type { ReactNode } from 'react'

/** A small white chip with the dot of its tone, such as a step of a phase with its count. */
export function DotChip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span data-slot="dot-chip" className="inline-flex h-5 items-center gap-1.5 rounded-full bg-surface px-2 text-[11.5px] font-medium shadow-xs">
      <i data-tone={tone} className="size-1.5 rounded-full bg-tone" aria-hidden="true" />
      {children}
    </span>
  )
}
