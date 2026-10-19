import { Board } from '@/components/Board.tsx'
import { orGap } from '@/components/Gap.tsx'
import { board, deskAreas } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default function Works() {
  return orGap(() => <Board cards={board()} areas={deskAreas()} />)
}
