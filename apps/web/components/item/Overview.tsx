import type { ReactNode } from 'react'

import type { ItemView } from '@nook/engineering/read/reader.ts'

import { Branches } from './Branches.tsx'
import { NeedsYou } from './NeedsYou.tsx'
import { NextStep } from './NextStep.tsx'
import { SliceBoard } from './SliceBoard.tsx'
import { Stats } from './Stats.tsx'
import { Stepper } from './Stepper.tsx'
import { Timeline } from './Timeline.tsx'

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="nk-sec">
      <h2 className="nk-h2">{title}</h2>
      {children}
    </section>
  )
}

/** The first tab of an item: where it is in the flow, who moves next, what waits for the owner, the slices, the code and the story. */
export function Overview({ view, now }: { view: ItemView; now: Date }) {
  return (
    <>
      <Stepper state={view.item.state} moves={view.moves} />
      <NextStep next={view.next} />
      <Stats view={view} now={now} />
      <Part title="Needs you"><NeedsYou view={view} /></Part>
      <Part title="Slices"><SliceBoard slices={view.slices} /></Part>
      <Part title="Branches and checks"><Branches changes={view.changes} checks={view.checks} /></Part>
      <Part title="What happened"><Timeline events={view.events} /></Part>
    </>
  )
}
