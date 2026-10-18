import type { ItemView } from '@nook/engineering/read/reader.ts'

import { STATE_TONE } from './tones.ts'

const OWNER_STEP = /^owner: \/gate (\w+)/

/** The head of an item page: its id, title and chips, and the next step with the button when the step is the owner's. */
export function ItemHeader({ view }: { view: ItemView }) {
  const { item, next } = view
  const move = next.owner ? OWNER_STEP.exec(next.skill)?.[1] : undefined
  return (
    <header className="nk-head">
      <p className="nk-head__id">{item.id}</p>
      <h1 className="nk-head__title">{item.title}</h1>
      <p className="nk-chips">
        <span className="bn-badge" data-variant="solid" data-tone={STATE_TONE[item.state] ?? 'neutral'}>{item.state}</span>
        <span className="bn-badge">{item.kind}</span>
        <span className="bn-badge">{item.size}</span>
        {item.areas.map(area => (
          <span className="bn-badge" key={area}>{area}</span>
        ))}
        {item.mode === 'yolo' ? <span className="bn-badge" data-tone="warning">yolo</span> : null}
      </p>
      <div className="bn-next">
        <span className="bn-next__label">Next</span>
        {move ? (
          <>
            <span className="bn-next__text">
              Your move: {move}
              <small>The button runs the move with the same guards as /gate {move}.</small>
            </span>
            <button type="button" className="bn-btn" data-variant="primary" data-move={move}>
              {move.charAt(0).toUpperCase() + move.slice(1)}
            </button>
          </>
        ) : (
          <span className="bn-next__text">
            The lead runs {next.skill}
            <small>Nothing waits for you.</small>
          </span>
        )}
      </div>
    </header>
  )
}
