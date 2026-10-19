import Link from 'next/link'

import type { BoardCard } from '@nook/engineering/read/reader.ts'

import { turnTitle } from '../lib/turn.ts'
import { AreaTags } from './Areas.tsx'
import { KindIcon, Turn } from './Marks.tsx'

/**
 * One item on the board: the title, the areas, the criteria met as a bar, a flag for what holds it up, and a foot with
 * the kind, the id, the size and whose move is next. A click opens the item in a dialog; a reload opens its page.
 */
export function ItemCard({ card }: { card: BoardCard }) {
  const { met, total } = card.criteria
  return (
    <Link className="bn-card nk-card" href={`/works/${card.id}`} data-item={card.id}>
      <span className="nk-card__title">{card.title}</span>
      <AreaTags names={card.areas} />
      {total ? (
        <span className="nk-bar" title={`${met} of ${total} criteria met`}>
          <i style={{ width: `${Math.round((100 * met) / total)}%` }} />
        </span>
      ) : null}
      {card.flags.length ? (
        <span className="nk-flags">
          {card.flags.map(flag => (
            <span className="nk-flag" key={flag}>{flag}</span>
          ))}
        </span>
      ) : null}
      <span className="nk-card__foot">
        <KindIcon kind={card.kind} />
        <span className="nk-card__id">{card.id}</span>
        {total ? <span>{met}/{total}</span> : null}
        <span className="nk-size" title={`size ${card.size}`}>{card.size}</span>
        <Turn owner={card.next.owner} title={turnTitle(card.next)} />
      </span>
    </Link>
  )
}
