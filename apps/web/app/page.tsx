import { EvError } from '@nook/shared/errors.ts'

import { Board } from '../components/Board.tsx'
import { Gap } from '../components/Gap.tsx'
import { board } from '../lib/desk.ts'

// each request reads the desk of NOOK_DESK, so one build serves every desk
export const dynamic = 'force-dynamic'

export default function Home() {
  try {
    return <Board cards={board()} />
  } catch (error) {
    if (error instanceof EvError) return <Gap error={error} />
    throw error
  }
}
