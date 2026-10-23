import type { ReactNode } from 'react'

export type Piece = { title: ReactNode; content: ReactNode }

/** The pieces of a change, each on a light panel, side by side, such as the areas of What changes. */
export function PieceGrid({ pieces }: { pieces: Piece[] }) {
  return (
    <div data-slot="piece-grid" className="grid gap-2.5 sm:grid-cols-2">
      {pieces.map((piece, i) => (
        <div key={i} className="grid content-start gap-1 rounded-md bg-muted/60 px-3.5 py-3">
          <h3 className="text-[13.5px] font-semibold">{piece.title}</h3>
          <p className="text-[13px] leading-5 text-muted-foreground">{piece.content}</p>
        </div>
      ))}
    </div>
  )
}
