import type { CSSProperties } from 'react'

import type { ItemView } from '@nook/engineering/read/reader.ts'

import { span } from '@/lib/time.ts'

function Ring({ part, whole, tone }: { part: number; whole: number; tone: string }) {
  const percent = Math.round((part / whole) * 100)
  return (
    <span className="bn-ring" data-tone={tone} style={{ '--v': percent, '--s': '48px' } as CSSProperties}>
      <span>{percent}%</span>
    </span>
  )
}

function Stat({ label, value, unit, ring }: { label: string; value: string; unit: string; ring?: React.ReactNode }) {
  return (
    <div className="bn-stat nk-stat">
      <div>
        <span className="bn-stat__label">{label}</span>
        <span className="bn-stat__value">{value}<small>{unit}</small></span>
      </div>
      {ring}
    </div>
  )
}

/** Four numbers of the item: the criteria met, the slices done, the time in its state, and how often it was sent back. */
export function Stats({ view, now }: { view: ItemView; now: Date }) {
  const met = view.criteria.filter(c => c.done).length
  const done = view.slices.filter(s => s.state === 'done').length
  const since = view.moves.at(-1)?.at
  const sentBack = view.moves.filter(m => m.move === 'reject').length
  const [time = '', ...rest] = since ? span(since, now).split(' ') : ['—']
  return (
    <div className="nk-stats">
      <Stat label="Criteria met" value={String(met)} unit={` / ${view.criteria.length}`} ring={view.criteria.length ? <Ring part={met} whole={view.criteria.length} tone="success" /> : null} />
      <Stat label="Slices done" value={String(done)} unit={` / ${view.slices.length}`} ring={view.slices.length ? <Ring part={done} whole={view.slices.length} tone="primary" /> : null} />
      <Stat label={`In ${view.item.state}`} value={time} unit={rest.length ? ` ${rest.join(' ')}` : ''} />
      <Stat label="Sent back" value={String(sentBack)} unit={sentBack === 1 ? ' time' : ' times'} />
    </div>
  )
}
