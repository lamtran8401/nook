import { SESSION_LIFE_MS } from '@nook/core/web/pairs.ts'

/**
 * The door of the web app. A page is free to read on the host 127.0.0.1 with the port; a write is an owner move, so
 * it needs the session of a paired browser and the origin of the page. A pair token from `nook web` or
 * `nook web pair` becomes that session cookie.
 */

export type GateRequest = { method: string; url: string; headers: Record<string, string | string[] | undefined> }
export type GateDecision = { kind: 'pass'; owner: boolean } | { kind: 'login'; cookie: string; location: string } | { kind: 'deny'; status: 401 | 403; reason: string }
/** The pairs of the workspace: `Pairs` of core, or a fake in a test. */
export type PairStore = { redeem: (token: string) => string | null; holds: (session: string) => boolean }

/** Set on a request of a paired browser before Next.js renders it; a header of that name from the browser is dropped. */
export const OWNER_HEADER = 'x-nook-owner'

const READS = new Set(['GET', 'HEAD'])

const header = (req: GateRequest, name: string): string | undefined => {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

export class Gate {
  readonly #host: string
  // cookies ignore the port, so the name holds it: two workspaces on two ports keep two sessions
  readonly #cookie: string
  readonly #pairs: PairStore

  constructor(port: number, pairs: PairStore) {
    this.#host = `127.0.0.1:${port}`
    this.#cookie = `nook_session_${port}`
    this.#pairs = pairs
  }

  admit(req: GateRequest): GateDecision {
    if (header(req, 'host') !== this.#host) return { kind: 'deny', status: 403, reason: 'the web app answers only on its own address' }
    const owner = this.#pairs.holds(this.#sessionOf(req) ?? '')
    const url = new URL(req.url, `http://${this.#host}`)
    const token = url.searchParams.get('t')
    if (!owner && token !== null) return this.#login(token, url)
    if (READS.has(req.method)) return { kind: 'pass', owner }
    if (!owner) return { kind: 'deny', status: 401, reason: 'pair this browser first: run `nook web pair` in your terminal' }
    if (header(req, 'origin') !== `http://${this.#host}`) return { kind: 'deny', status: 403, reason: 'a change must come from a page of the web app' }
    return { kind: 'pass', owner }
  }

  #sessionOf(req: GateRequest): string | undefined {
    return header(req, 'cookie')
      ?.split(';')
      .map(part => part.trim().split('='))
      .find(([name]) => name === this.#cookie)?.[1]
  }

  #login(token: string, url: URL): GateDecision {
    const session = this.#pairs.redeem(token)
    if (!session) return { kind: 'deny', status: 401, reason: 'this link was used, is old or is wrong: run `nook web pair` for a new one' }
    url.searchParams.delete('t')
    return { kind: 'login', cookie: `${this.#cookie}=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_LIFE_MS / 1000}`, location: `${url.pathname}${url.search}` }
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
