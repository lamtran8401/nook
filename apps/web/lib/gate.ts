import { randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * The door of the web app. The one-time token of `nook web` becomes a session cookie; each later request needs that
 * cookie, the host 127.0.0.1 with the port, and for a write the origin of the page.
 */

export type GateRequest = { method: string; url: string; headers: Record<string, string | string[] | undefined> }
export type GateDecision = { kind: 'pass' } | { kind: 'login'; cookie: string; location: string } | { kind: 'deny'; status: 401 | 403; reason: string }

const COOKIE = 'nook_session'
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

const cookieOf = (req: GateRequest): string | undefined =>
  header(req, 'cookie')
    ?.split(';')
    .map(part => part.trim().split('='))
    .find(([name]) => name === COOKIE)?.[1]

export class Gate {
  readonly #sessions = new Set<string>()
  readonly #host: string
  readonly #newId: () => string
  #token: string | null

  constructor(token: string, port: number, newId: () => string = () => randomBytes(32).toString('base64url')) {
    this.#token = token
    this.#host = `127.0.0.1:${port}`
    this.#newId = newId
  }

  admit(req: GateRequest): GateDecision {
    if (header(req, 'host') !== this.#host) return { kind: 'deny', status: 403, reason: 'the web app answers only on its own address' }
    const url = new URL(req.url, `http://${this.#host}`)
    const token = url.searchParams.get('t')
    if (token !== null) return this.#login(token, url)
    const session = cookieOf(req)
    if (!session || !this.#sessions.has(session)) return { kind: 'deny', status: 401, reason: 'open the web app with `nook web`' }
    if (!READS.has(req.method) && header(req, 'origin') !== `http://${this.#host}`)
      return { kind: 'deny', status: 403, reason: 'a change must come from a page of the web app' }
    return { kind: 'pass' }
  }

  #login(token: string, url: URL): GateDecision {
    if (this.#token === null || !sameText(token, this.#token)) return { kind: 'deny', status: 401, reason: 'this link was used or is wrong: run `nook web` again' }
    this.#token = null
    const id = this.#newId()
    this.#sessions.add(id)
    url.searchParams.delete('t')
    return { kind: 'login', cookie: `${COOKIE}=${id}; HttpOnly; SameSite=Strict; Path=/`, location: `${url.pathname}${url.search}` }
  }
}
