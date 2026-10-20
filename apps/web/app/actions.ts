'use server'

import { deskBySlug } from '@/lib/desks.ts'
import { type MoveForm, type MoveResult, runMove } from '@/lib/moves.ts'

/** The server action of every owner move on a page; the gate let in only the owner's cookie and the page's Origin. */
export async function ownerMove(_last: MoveResult | null, data: FormData): Promise<MoveResult> {
  const form: MoveForm = Object.fromEntries([...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
  const desk = deskBySlug(form.desk ?? '')
  if (!desk) return { ok: false, lines: [`${form.desk || 'no desk'} is no desk of this web app`] }
  return runMove(form, desk.dir)
}
