import { Board } from '@/components/board.tsx'
import { orGap } from '@/components/gap.tsx'
import { board, deskAreas } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default function Works() {
  return orGap(() => <Board cards={board()} areas={deskAreas()} />)
}
