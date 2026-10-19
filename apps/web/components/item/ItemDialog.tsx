import type { ItemView } from '@nook/engineering/read/reader.ts'

import { clock, day } from '@/lib/time.ts'
import { Criteria } from '@/components/Criteria.tsx'
import { EmptyState } from '@/components/EmptyState.tsx'
import { Records } from '@/components/Records.tsx'
import { ItemChips } from '@/components/item/ItemChips.tsx'

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
          <ItemChips item={item} />
        </div>
      </div>
      <div className="bn-dialog__body">
        <h3 className="bn-actions__group">Criteria</h3>
        {view.criteria.length ? <Criteria criteria={view.criteria} /> : <EmptyState compact icon="check" title="No criteria yet">The spec step writes them.</EmptyState>}
        <h3 className="bn-actions__group">Slices</h3>
        {view.slices.length ? (
          <Records rows={view.slices.map(slice => ({ id: slice.id, main: slice.title, sub: slice.reason ?? undefined, end: <span className="bn-badge" data-tone={SLICE_TONE[slice.state]}>{slice.state}</span> }))} />
        ) : (
          <EmptyState compact icon="layers" title="No slice yet">The plan step writes them in tasks.md.</EmptyState>
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
