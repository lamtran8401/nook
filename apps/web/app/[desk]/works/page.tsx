import { Board } from '@/components/board.tsx'
import { orGap } from '@/components/gap.tsx'
import { board, deskAreas, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Works({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return orGap(() => <Board cards={board(desk.dir)} areas={deskAreas(desk.dir)} base={desk.base} />)
}
