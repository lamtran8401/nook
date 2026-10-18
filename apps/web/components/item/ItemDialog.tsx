import type { ItemView } from '@nook/engineering/read/reader.ts'

import { clock, day } from '../../lib/time.ts'
import { Criteria } from '../Criteria.tsx'
import { STATE_TONE } from '../tones.ts'

const SLICE_TONE: Record<string, string> = { todo: 'neutral', running: 'primary', waiting: 'warning', done: 'success', failed: 'danger', cancelled: 'neutral' }
const LAST_EVENTS = 5

/** An item in a dialog over the board: its head, criteria, slices and last events, and the way to its full page. */
export function ItemDialog({ view }: { view: ItemView }) {
  const { item } = view
  return (
    <>
      <div className="bn-dialog__head">
        <div>
          <p className="nk-head__kicker">{item.id}</p>
          <h2 className="bn-dialog__title">{item.title}</h2>
          <p className="nk-chips">
            <span className="bn-badge" data-variant="solid" data-tone={STATE_TONE[item.state] ?? 'neutral'}>{item.state}</span>
            <span className="bn-badge" data-variant="plain">{item.kind}</span>
            <span className="bn-badge" data-variant="plain">size {item.size}</span>
            {item.areas.map(area => (
              <span className="bn-badge" key={area}>{area}</span>
            ))}
          </p>
        </div>
      </div>
      <div className="bn-dialog__body">
        <h3 className="bn-actions__group">Criteria</h3>
        {view.criteria.length ? <Criteria criteria={view.criteria} /> : <p className="nk-empty">No criteria yet.</p>}
        <h3 className="bn-actions__group">Slices</h3>
        {view.slices.length ? (
          <ul className="nk-slices">
            {view.slices.map(s => (
              <li key={s.id}>
                <span className="nk-slices__id">{s.id}</span>
                <span>{s.title}</span>
                <span className="bn-badge" data-tone={SLICE_TONE[s.state]}>{s.state}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="nk-empty">No slice yet.</p>
        )}
        <h3 className="bn-actions__group">Last events</h3>
        <ul className="nk-events">
          {view.events.slice(-LAST_EVENTS).reverse().map(e => (
            <li key={`${e.at}${e.title}`}>
              <span className="nk-events__at">{day(e.at)} {clock(e.at)}</span>
              <span>{e.title}{e.text ? <small> · {e.text}</small> : null}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bn-dialog__foot">
        <a className="bn-btn" data-variant="primary" href={`/works/${item.id}`} target="_blank" rel="noopener">Open in new tab</a>
      </div>
    </>
  )
}
