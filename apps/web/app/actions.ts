'use server'

import { workspaceBySlug } from '@/lib/workspaces.ts'
import { type MoveForm, type MoveResult, runMove } from '@/lib/moves.ts'

/** The server action of every owner move on a page; the gate let in only the owner's cookie and the page's Origin. */
export async function ownerMove(_last: MoveResult | null, data: FormData): Promise<MoveResult> {
  const form: MoveForm = Object.fromEntries([...data.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
  const workspace = workspaceBySlug(form.workspace ?? '')
  if (!workspace) return { ok: false, lines: [`${form.workspace || 'no workspace'} is no workspace of this web app`] }
  return runMove(form, workspace.dir)
}
