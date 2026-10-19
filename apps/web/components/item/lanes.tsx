import type { Slice } from '@nook/engineering/stores/slices.ts'
import { Section } from '@nook/ui/components/section.tsx'

import { Diagram, type DiagramSpec } from '@/components/diagram.tsx'

// the chip of a slice on its node, by its state; a slice to do has none
const STATUS: Partial<Record<Slice['state'], string>> = { done: 'done', running: 'run', waiting: 'wait', failed: 'fail' }

/** The lanes of the slices, as the Bench graph lays them out: one lane for each area, an edge for each slice it waits for. */
export function lanesSpec(slices: Slice[]): DiagramSpec | null {
  const live = slices.filter(s => s.state !== 'cancelled')
  if (!live.length) return null
  const ids = new Set(live.map(s => s.id))
  const areas = [...new Set(live.map(s => s.area))]
  return {
    type: 'graph',
    nodes: live.map(s => ({ id: s.id, kicker: s.id, title: s.title, ...(STATUS[s.state] ? { status: STATUS[s.state], statusText: s.state } : {}) })),
    edges: live.flatMap(s => s.depends.filter(d => ids.has(d)).map(d => ({ from: d, to: s.id }))),
    groups: areas.map(area => ({ label: area, nodes: live.filter(s => s.area === area).map(s => s.id) })),
  }
}

export function Lanes({ slices }: { slices: Slice[] }) {
  const spec = lanesSpec(slices)
  return spec ? <Section title="Lanes"><Diagram spec={spec} /></Section> : null
}
