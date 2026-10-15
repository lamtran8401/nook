import { denied } from '@kit/shared/errors.ts'

/** Who calls the tool, and the one table of what each role may do (docs/engineering.md section 8). */

export const ROLES = ['owner', 'lead', 'builder', 'reader'] as const
export type Role = (typeof ROLES)[number]

export type Who = { role: Role; actor: string; session: string | null }

/** `KIT_ROLE` if set and valid, else `CLAUDECODE` set → lead, else owner. */
export function whoFromEnv(env: NodeJS.ProcessEnv = process.env): Who {
  const named = env.KIT_ROLE as Role | undefined
  const role: Role = named && ROLES.includes(named) ? named : env.CLAUDECODE ? 'lead' : 'owner'
  const actor = env.KIT_ACTOR?.trim() || role
  const session = env.KIT_SESSION?.trim() || env.CLAUDE_SESSION_ID?.trim() || null
  return { role, actor, session }
}

export type Action =
  | 'approve' | 'accept' | 'mode' | 'proceed'
  | 'move' | 'item new' | 'item edit' | 'item ac add' | 'item archive' | 'ask' | 'answer'
  | 'task import' | 'task retry' | 'task reopen' | 'task cancel' | 'guess accept' | 'guess flip' | 'adr' | 'item commit' | 'item branch'
  | 'task start' | 'task done' | 'task wait' | 'task resume' | 'task fail'
  | 'task prove' | 'item verify' | 'item ac done' | 'guess' | 'note add' | 'pickup' | 'quick'

const OWNER: Role[] = ['owner']
const LEADERS: Role[] = ['owner', 'lead']
const WORKERS: Role[] = ['owner', 'lead', 'builder']
/** The verifier and the reviewer are readers: the hook lets only them run these. */
const WITH_READER: Role[] = ['owner', 'lead', 'builder', 'reader']

export const PERMISSIONS: Record<Action, Role[]> = {
  approve: OWNER,
  accept: OWNER,
  mode: OWNER,
  proceed: ['lead'],
  move: LEADERS,
  'item new': LEADERS,
  'item edit': LEADERS,
  'item ac add': LEADERS,
  'item archive': LEADERS,
  ask: LEADERS,
  answer: LEADERS,
  'task import': LEADERS,
  'task retry': LEADERS,
  'task reopen': LEADERS,
  'task cancel': LEADERS,
  'guess accept': LEADERS,
  'guess flip': LEADERS,
  adr: LEADERS,
  'item commit': LEADERS,
  'item branch': LEADERS,
  quick: LEADERS,
  pickup: LEADERS,
  'task start': WORKERS,
  'task done': WORKERS,
  'task wait': WORKERS,
  'task resume': WORKERS,
  'task fail': WORKERS,
  'task prove': WITH_READER,
  'item verify': WITH_READER,
  'item ac done': ['owner', 'lead', 'reader'],
  guess: WORKERS,
  'note add': WORKERS,
}

export const can = (who: Who, action: Action) => PERMISSIONS[action].includes(who.role)

export function assertCan(who: Who, action: Action): void {
  if (can(who, action)) return
  const allowed = PERMISSIONS[action].map(role => `the ${role}`).join(' or ')
  throw denied(`${action}: only ${allowed} can do this (you are ${who.role})`)
}

/** A builder works on its own slice only. */
export function assertOwnSlice(who: Who, assignee: string | null, slice: string): void {
  if (who.role !== 'builder' || assignee === who.actor) return
  throw denied(`${slice} is ${assignee ? `the slice of ${assignee}` : 'not your slice'} (you are ${who.actor}): a builder works on its own slice only`)
}
