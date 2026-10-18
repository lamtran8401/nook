import { type BoardCard, readBoard } from '@nook/engineering/read/reader.ts'

/** The folder of the desk that the web app shows, from `NOOK_DESK`. */
export function deskDir(): string {
  const dir = process.env.NOOK_DESK
  if (!dir) throw new Error('NOOK_DESK is not set: start the web app with `nook web`')
  return dir
}

export const board = (): BoardCard[] => readBoard(deskDir())
