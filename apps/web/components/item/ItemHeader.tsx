import type { ItemView } from '@nook/engineering/read/reader.ts'

import { clock, day } from '../../lib/time.ts'
import { STATE_TONE } from '../tones.ts'

/** The head of an item page: the way back to the board, the title, the chips, and the key moments of the item. */
export function ItemHeader({ view }: { view: ItemView }) {
  const { item, moves } = view
  const last = (move: string) => moves.findLast(m => m.move === move)?.at
  const started = last('start')
  const approved = last('approve')
  const sentBack = moves.filter(m => m.move === 'reject').length
  return (
    <header className="nk-head">
      <ol className="bn-breadcrumb">
        <li><a href="/works">Works</a></li>
        <li><span aria-current="page">{item.id}</span></li>
      </ol>
      <h1 className="nk-head__title">{item.title}</h1>
      <p className="nk-chips">
        <span className="bn-badge" data-variant="solid" data-tone={STATE_TONE[item.state] ?? 'neutral'}>{item.state}</span>
        <span className="bn-badge" data-variant="plain">{item.kind}</span>
        <span className="bn-badge" data-variant="plain">size {item.size}</span>
        {item.areas.map(area => (
          <span className="bn-badge" key={area}>{area}</span>
        ))}
        <span className="bn-badge" data-variant="plain" data-tone={item.mode === 'yolo' ? 'warning' : undefined}>mode {item.mode}</span>
      </p>
      <p className="nk-keys">
        {started ? <span>Started<b>{day(started)}</b></span> : null}
        {approved ? <span>Approved<b>{day(approved)} {clock(approved)}</b></span> : null}
        {sentBack ? <span>Sent back<b>{sentBack}×</b></span> : null}
      </p>
    </header>
  )
}
