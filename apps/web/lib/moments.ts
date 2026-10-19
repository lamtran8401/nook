import type { ItemMove } from '@nook/engineering/read/reader.ts'

/** The key moments of an item from its moves: the last start, the last approve, and how often it was sent back. */
export function keyMoments(moves: ItemMove[]): { started?: string | undefined; approved?: string | undefined; sentBack: number } {
  const last = (move: string) => moves.findLast(m => m.move === move)?.at
  return { started: last('start'), approved: last('approve'), sentBack: moves.filter(m => m.move === 'reject').length }
}
