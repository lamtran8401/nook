import type { ItemView } from '@nook/engineering/read/reader.ts'
import { Section } from '@nook/ui/components/section.tsx'

import { Branches } from '@/components/item/branches.tsx'
import { NeedsYou } from '@/components/item/needs-you.tsx'
import { NextStep } from '@/components/item/next-step.tsx'
import { SliceBoard } from '@/components/item/slice-board.tsx'
import { Stats } from '@/components/item/stats.tsx'
import { Stepper } from '@/components/item/stepper.tsx'
import { Timeline } from '@/components/item/timeline.tsx'

/** The first tab of an item: where it is in the flow, who moves next, what waits for the owner, the slices, the code and the story. */
export function Overview({ view, now }: { view: ItemView; now: Date }) {
  return (
    <>
      <Stepper state={view.item.state} moves={view.moves} />
      <NextStep next={view.next} />
      <Stats view={view} now={now} />
      <Section title="Needs you"><NeedsYou view={view} /></Section>
      <Section title="Slices"><SliceBoard slices={view.slices} /></Section>
      <Section title="Branches and checks"><Branches changes={view.changes} checks={view.checks} /></Section>
      <Section title="What happened"><Timeline events={view.events} /></Section>
    </>
  )
}
