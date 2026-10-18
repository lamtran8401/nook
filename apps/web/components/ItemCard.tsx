import type { BoardCard } from '@nook/engineering/read/reader.ts'

/** One item on the board: a link to its page. */
export function ItemCard({ card }: { card: BoardCard }) {
  return (
    <a className="bn-card nk-card" href={`/works/${card.id}`} data-item={card.id}>
      <span className="nk-card__id">{card.id}</span>
      <span className="nk-card__title">{card.title}</span>
      <span className="nk-chips">
        <span className="bn-badge">{card.kind}</span>
        <span className="bn-badge">{card.size}</span>
        {card.areas.map(area => (
          <span className="bn-badge" key={area}>{area}</span>
        ))}
      </span>
      <span className="nk-card__criteria">
        {card.criteria.total ? `${card.criteria.met}/${card.criteria.total} criteria` : 'no criteria yet'}
      </span>
    </a>
  )
}
