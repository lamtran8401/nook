import { randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * The door of the web app. The one-time token of `nook web` becomes a session cookie; each later request needs that
 * cookie, the host 127.0.0.1 with the port, and for a write the origin of the page.
 */

export type GateRequest = { method: string; url: string; headers: Record<string, string | string[] | undefined> }
export type GateDecision = { kind: 'pass' } | { kind: 'login'; cookie: string; location: string } | { kind: 'deny'; status: 401 | 403; reason: string }
export type GateOptions = { newId?: () => string; now?: () => number }

// the browser opens the address at once; a token that waits longer was seen by someone else, or was lost
const TOKEN_LIFE_MS = 2 * 60 * 1000
const READS = new Set(['GET', 'HEAD'])

const header = (req: GateRequest, name: string): string | undefined => {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

const sameText = (a: string, b: string): boolean => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export class Gate {
  readonly #sessions = new Set<string>()
  readonly #host: string
  // cookies ignore the port, so the name holds it: two desks on two ports keep two sessions
  readonly #cookie: string
  readonly #newId: () => string
  readonly #now: () => number
  readonly #expires: number
  #token: string | null

  constructor(token: string, port: number, options: GateOptions = {}) {
    this.#token = token || null
    this.#host = `127.0.0.1:${port}`
    this.#cookie = `nook_session_${port}`
    this.#newId = options.newId ?? (() => randomBytes(32).toString('base64url'))
    this.#now = options.now ?? Date.now
    this.#expires = this.#now() + TOKEN_LIFE_MS
  }

  admit(req: GateRequest): GateDecision {
    if (header(req, 'host') !== this.#host) return { kind: 'deny', status: 403, reason: 'the web app answers only on its own address' }
    if (this.#sessions.has(this.#sessionOf(req) ?? '')) {
      if (!READS.has(req.method) && header(req, 'origin') !== `http://${this.#host}`)
        return { kind: 'deny', status: 403, reason: 'a change must come from a page of the web app' }
      return { kind: 'pass' }
    }
    const url = new URL(req.url, `http://${this.#host}`)
    const token = url.searchParams.get('t')
    if (token !== null) return this.#login(token, url)
    return { kind: 'deny', status: 401, reason: 'open the web app with `nook web`' }
  }

  #sessionOf(req: GateRequest): string | undefined {
    return header(req, 'cookie')
      ?.split(';')
      .map(part => part.trim().split('='))
      .find(([name]) => name === this.#cookie)?.[1]
  }

  #login(token: string, url: URL): GateDecision {
    const valid = this.#token !== null && this.#now() <= this.#expires && sameText(token, this.#token)
    if (!valid) return { kind: 'deny', status: 401, reason: 'this link was used, is old or is wrong: run `nook web` again' }
    this.#token = null
    const id = this.#newId()
    this.#sessions.add(id)
    url.searchParams.delete('t')
    return { kind: 'login', cookie: `${this.#cookie}=${id}; HttpOnly; SameSite=Strict; Path=/`, location: `${url.pathname}${url.search}` }
  }
}

export type GateAnswer = { status: number; headers: Record<string, string>; body: string }

const html = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

/**
 * What the server sends itself for a login or a denial. A login is a page that sets the cookie and then moves to the
 * address: the token came from a page on the disk, another site, and a browser sends no SameSite=Strict cookie on a
 * navigation that another site started, also after a redirect; a move that this page starts is on the same site.
 */
export function gateAnswer(decision: Exclude<GateDecision, { kind: 'pass' }>): GateAnswer {
  if (decision.kind === 'deny') return { status: decision.status, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: decision.reason }
  const to = JSON.stringify(decision.location).replace(/</g, '\\u003c')
  return {
    status: 200,
    headers: { 'Set-Cookie': decision.cookie, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    body: `<!doctype html><meta charset="utf-8"><title>Nook</title><meta http-equiv="refresh" content="0;url=${html(decision.location)}"><script>location.replace(${to})</script>`,
  }
}
