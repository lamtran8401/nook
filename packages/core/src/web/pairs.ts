import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { STATE_DIR } from '@nook/shared/names.ts'

/**
 * The browsers that may run owner moves on the web app of a desk. `nook web` and `nook web pair` offer a one-time
 * token; the gate swaps it for a session. `.nook/web-pairs.json` holds only hashes, so the file opens no door.
 */

type Entry = { hash: string; expires: number }
type PairFile = { tokens: Entry[]; sessions: Entry[] }
export type PairOptions = { now?: () => number; newSecret?: () => string }

// the browser opens the link at once; a token that waits longer was seen by someone else, or was lost
const TOKEN_LIFE_MS = 2 * 60 * 1000
export const SESSION_LIFE_MS = 30 * 24 * 60 * 60 * 1000

const hashOf = (secret: string) => createHash('sha256').update(secret).digest('hex')

export class Pairs {
  readonly #file: string
  readonly #now: () => number
  readonly #newSecret: () => string

  constructor(desk: string, options: PairOptions = {}) {
    this.#file = join(desk, STATE_DIR, 'web-pairs.json')
    this.#now = options.now ?? Date.now
    this.#newSecret = options.newSecret ?? (() => randomBytes(32).toString('base64url'))
  }

  /** A new pair token, the only copy of its text. */
  offer(): string {
    const token = this.#newSecret()
    const pairs = this.#live()
    this.#write({ ...pairs, tokens: [...pairs.tokens, { hash: hashOf(token), expires: this.#now() + TOKEN_LIFE_MS }] })
    return token
  }

  /** The session of a valid token; the token is spent. */
  redeem(token: string): string | null {
    const pairs = this.#live()
    const hash = hashOf(token)
    if (!token || !pairs.tokens.some(t => t.hash === hash)) return null
    const session = this.#newSecret()
    this.#write({ tokens: pairs.tokens.filter(t => t.hash !== hash), sessions: [...pairs.sessions, { hash: hashOf(session), expires: this.#now() + SESSION_LIFE_MS }] })
    return session
  }

  holds(session: string): boolean {
    const hash = hashOf(session)
    return Boolean(session) && this.#live().sessions.some(s => s.hash === hash)
  }

  /** Removes each pair; returns the number of sessions that were on. */
  forget(): number {
    const sessions = this.#live().sessions.length
    this.#write({ tokens: [], sessions: [] })
    return sessions
  }

  #live(): PairFile {
    const now = this.#now()
    const pairs: PairFile = existsSync(this.#file) ? JSON.parse(readFileSync(this.#file, 'utf8')) : { tokens: [], sessions: [] }
    return { tokens: pairs.tokens.filter(t => t.expires >= now), sessions: pairs.sessions.filter(s => s.expires >= now) }
  }

  // a rename replaces the file whole, so the server never reads half a write of the CLI
  #write(pairs: PairFile): void {
    mkdirSync(join(this.#file, '..'), { recursive: true })
    const next = `${this.#file}.${process.pid}`
    writeFileSync(next, `${JSON.stringify(pairs, null, 2)}\n`, { mode: 0o600 })
    renameSync(next, this.#file)
  }
}
