import { denied, usage } from '@nook/shared/errors.ts'

/** Who calls the tool, and the one table of what each role can do (docs/reference/engineering.md section 8). */

export const ROLES = ['owner', 'lead', 'builder', 'reader'] as const
export type Role = (typeof ROLES)[number]

export class Who {
  constructor(
    readonly role: Role,
    readonly actor: string,
    readonly session: string | null,
  ) {}

  /** The same caller, its actor labelled with the way the move came, such as `owner (viewer)` for the web app. */
  via(way: string): Who {
    if (!/^[a-z]+$/.test(way)) throw usage(`--via takes one plain word, such as viewer, not ${way}`)
    return new Who(this.role, `${this.actor} (${way})`, this.session)
  }

  /** `NOOK_ROLE` when it names a role; else `CLAUDECODE` set means the lead, and unset means the owner. */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): Who {
    const named = env.NOOK_ROLE as Role | undefined
    const role: Role = named && ROLES.includes(named) ? named : env.CLAUDECODE ? 'lead' : 'owner'
    const actor = env.NOOK_ACTOR?.trim() || role
    const session = env.NOOK_SESSION?.trim() || env.CLAUDE_SESSION_ID?.trim() || null
    return new Who(role, actor, session)
  }
}

export type Action =
  | 'approve'
  | 'accept'
  | 'mode'
  | 'proceed'
  | 'move'
  | 'item new'
  | 'item edit'
  | 'item ac add'
  | 'item archive'
  | 'ask'
  | 'answer'
  | 'task import'
  | 'task retry'
  | 'task reopen'
  | 'task cancel'
  | 'guess accept'
  | 'guess flip'
  | 'adr'
  | 'item commit'
  | 'item branch'
  | 'task start'
  | 'task done'
  | 'task wait'
  | 'task resume'
  | 'task fail'
  | 'task prove'
  | 'item verify'
  | 'item ac done'
  | 'guess'
  | 'note add'
  | 'pickup'
  | 'quick'

const OWNER: Role[] = ['owner']
const LEADERS: Role[] = ['owner', 'lead']
const WORKERS: Role[] = ['owner', 'lead', 'builder']
/** The hook lets only the verifier and the reviewer among the readers run these. */
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

export class Permissions {
  constructor(private readonly who: Who) {}

  can(action: Action): boolean {
    return PERMISSIONS[action].includes(this.who.role)
  }

  /** Exit 5 when the role of the caller cannot do `action`. */
  assert(action: Action): void {
    if (this.can(action)) return
    const allowed = PERMISSIONS[action].map(role => `the ${role}`).join(' or ')
    throw denied(`${action}: only ${allowed} can do this (you are ${this.who.role})`)
  }

  assertOwnSlice(assignee: string | null, slice: string): void {
    if (this.who.role !== 'builder' || assignee === this.who.actor) return
    const whose = assignee ? `the slice of ${assignee}` : 'not your slice'
    throw denied(`${slice} is ${whose} (you are ${this.who.actor}): a builder works on its own slice only`)
  }
}
