import type { Slice } from '@nook/engineering/stores/slices.ts'
import { Tile } from '@nook/ui/components/tile.tsx'

import { Diagram, type DiagramSpec } from '@/components/diagram.tsx'

// the tone of a slice node by its state; a slice to do keeps the plain node
const TONE: Partial<Record<Slice['state'], string>> = { done: 'success', running: 'primary', waiting: 'warning', failed: 'danger' }

/** One node of a slice: its state in the kicker, such as `T1 · DONE`, on a node in the tone of the state; the slice at work rings. */
function node(slice: Slice) {
  const tone = TONE[slice.state]
  if (!tone) return { id: slice.id, kicker: slice.id, title: slice.title }
  return { id: slice.id, kicker: `${slice.id} · ${slice.state.toUpperCase()}`, title: slice.title, tone, fill: 'soft', ...(slice.state === 'running' ? { hl: true } : {}) }
}

/** The lanes of the slices, as the Bench graph lays them out: one lane for each area, an edge for each slice it waits for. */
export function lanesSpec(slices: Slice[]): DiagramSpec | null {
  const live = slices.filter(s => s.state !== 'cancelled')
  if (!live.length) return null
  const ids = new Set(live.map(s => s.id))
  const areas = [...new Set(live.map(s => s.area))]
  return {
    type: 'graph',
    nodes: live.map(node),
    edges: live.flatMap(s => s.depends.filter(d => ids.has(d)).map(d => ({ from: d, to: s.id }))),
    groups: areas.map(area => ({ label: area, nodes: live.filter(s => s.area === area).map(s => s.id) })),
  }
}

export function Lanes({ slices }: { slices: Slice[] }) {
  const spec = lanesSpec(slices)
  return spec ? (
    <Tile title="Lanes" note="one for each area">
      <Diagram spec={spec} />
    </Tile>
  ) : null
}
