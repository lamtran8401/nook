import { Bookmark, Bug, ListChecks, Search } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { IconTile } from '@nook/ui/components/icon-tile.tsx'
import { RingIcon } from '@nook/ui/components/ring.tsx'
import { Badge } from '@nook/ui/components/badge.tsx'

import { KIND_TONE, STATE_TONE } from '@/components/tones.ts'

/** The marks of an item that every page shares, as kit parts: its state, its kind and whose turn it is. */

// how far along the flow each state is: the share of the ring that its icon fills
const FILL: Record<string, number> = { framing: 0.25, planning: 0.4, ready: 0.55, cooking: 0.7, review: 0.85, blocked: 0.7, done: 1 }

export function StateIcon({ state, size = 14 }: { state: string; size?: number }) {
  return <RingIcon fill={FILL[state] ?? 0} tone={STATE_TONE[state] ?? 'neutral'} size={size} />
}

/** The state as a tag: its icon and its name, in its tone. */
export function StateTag({ state }: { state: string }) {
  return (
    <Badge tone={STATE_TONE[state] ?? 'neutral'}>
      <StateIcon state={state} size={12} />
      {state}
    </Badge>
  )
}

const KIND_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = { feature: Bookmark, fix: Bug, chore: ListChecks, investigate: Search }

export function KindIcon({ kind }: { kind: string }) {
  const Glyph = KIND_ICON[kind] ?? ListChecks
  return (
    <IconTile tone={KIND_TONE[kind] ?? 'neutral'} size="xs" label={kind}>
      <Glyph className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </IconTile>
  )
}

/** Whose move comes next: YOU for the owner, AI for the lead; the title names the move. */
export function Turn({ owner, title }: { owner: boolean; title: string }) {
  return (
    <Badge tone={owner ? 'primary' : 'violet'} variant="solid" title={title}>
      {owner ? 'YOU' : 'AI'}
    </Badge>
  )
}
