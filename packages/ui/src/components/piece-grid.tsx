import type { ReactNode } from 'react'

import { Card } from '@nook/ui/components/card.tsx'

export type Piece = { title: ReactNode; content: ReactNode }

/** The pieces of a change, each in its own card, side by side. */
export function PieceGrid({ pieces }: { pieces: Piece[] }) {
  return (
    <div data-slot="piece-grid" className="grid gap-3 sm:grid-cols-2">
      {pieces.map((piece, i) => (
        <Card key={i} className="gap-1.5 px-5 py-4">
          <h3 className="text-[15px] font-semibold">{piece.title}</h3>
          <p className="text-sm text-muted-foreground">{piece.content}</p>
        </Card>
      ))}
    </div>
  )
}
