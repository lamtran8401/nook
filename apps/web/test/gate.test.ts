import { describe, expect, test } from 'bun:test'

import { Gate, gateAnswer, type GateRequest, type PairStore } from '../lib/gate.ts'

const PORT = 4321
const HOST = `127.0.0.1:${PORT}`
const COOKIE = 'nook_session_4321=session-1'

/** A store with one open token, `token-abc`, that gives `session-1` once. */
function store(): PairStore {
  const tokens = new Set(['token-abc'])
  const sessions = new Set<string>()
  return {
    redeem: token => (tokens.delete(token) ? (sessions.add('session-1'), 'session-1') : null),
    holds: session => sessions.has(session),
  }
}
const paired = () => {
  const gate = new Gate(PORT, store())
  gate.admit(request('/?t=token-abc'))
  return gate
}
const request = (url: string, headers: GateRequest['headers'] = {}, method = 'GET'): GateRequest => ({ method, url, headers: { host: HOST, ...headers } })

describe('gateAnswer', () => {
  test('a login is a page that sets the cookie and moves to the address itself, so the browser sends the Strict cookie', () => {
    expect(gateAnswer({ kind: 'login', cookie: 'nook_session_4321=s-1; HttpOnly; SameSite=Strict; Path=/', location: '/works?tab=plan&x=<y>' })).toEqual({
      status: 200,
      headers: { 'Set-Cookie': 'nook_session_4321=s-1; HttpOnly; SameSite=Strict; Path=/', 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      body: '<!doctype html><meta charset="utf-8"><title>Nook</title><meta http-equiv="refresh" content="0;url=/works?tab=plan&amp;x=&lt;y>"><script>location.replace("/works?tab=plan&x=\\u003cy>")</script>',
    })
  })

  test('a denial is its reason as plain text', () => {
    expect(gateAnswer({ kind: 'deny', status: 401, reason: 'pair this browser' })).toEqual({ status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'pair this browser' })
  })
})

describe('Gate', () => {
  test('a pair token sets a session cookie of 30 days and drops the token from the address', () => {
    expect(new Gate(PORT, store()).admit(request('/works?t=token-abc&tab=plan'))).toEqual({
      kind: 'login',
      cookie: 'nook_session_4321=session-1; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000',
      location: '/works?tab=plan',
    })
  })

  test('a spent or wrong token is refused with the command for a new link', () => {
    const gate = paired()
    expect(gate.admit(request('/?t=token-abc'))).toEqual({ kind: 'deny', status: 401, reason: 'this link was used, is old or is wrong: run `nook web pair` for a new one' })
    expect(gate.admit(request('/?t=token-xyz'))).toMatchObject({ kind: 'deny', status: 401 })
  })

  test('a read passes with no session, and says that the browser is not paired', () => {
    expect(new Gate(PORT, store()).admit(request('/works'))).toEqual({ kind: 'pass', owner: false })
    expect(paired().admit(request('/works', { cookie: 'nook_session_4321=session-9' }))).toEqual({ kind: 'pass', owner: false })
  })

  test('a read with the session cookie passes as the owner', () => {
    expect(paired().admit(request('/works', { cookie: `theme=dark; ${COOKIE}` }))).toEqual({ kind: 'pass', owner: true })
  })

  test('a write with no session is refused with the command that pairs', () => {
    expect(paired().admit(request('/works/SHOP-12', { origin: `http://${HOST}` }, 'POST'))).toEqual({ kind: 'deny', status: 401, reason: 'pair this browser first: run `nook web pair` in your terminal' })
  })

  test('a write of the owner passes only from the origin of the page', () => {
    const gate = paired()
    expect(gate.admit(request('/works/SHOP-12', { cookie: COOKIE, origin: `http://${HOST}` }, 'POST'))).toEqual({ kind: 'pass', owner: true })
    expect(gate.admit(request('/works/SHOP-12', { cookie: COOKIE, origin: 'http://evil.test' }, 'POST'))).toMatchObject({ kind: 'deny', status: 403 })
    expect(gate.admit(request('/works/SHOP-12', { cookie: COOKIE }, 'POST'))).toMatchObject({ kind: 'deny', status: 403 })
  })

  test('a request for another host is refused, so a renamed address cannot reach the server', () => {
    expect(new Gate(PORT, store()).admit({ method: 'GET', url: '/?t=token-abc', headers: { host: `evil.test:${PORT}` } })).toMatchObject({ kind: 'deny', status: 403 })
    expect(new Gate(PORT, store()).admit({ method: 'GET', url: '/works', headers: { host: `evil.test:${PORT}` } })).toMatchObject({ kind: 'deny', status: 403 })
  })

  test('a paired browser passes, also when its address has its own t', () => {
    expect(paired().admit(request('/search?t=wiki', { cookie: COOKIE }))).toEqual({ kind: 'pass', owner: true })
  })

  test('the cookie of another port is no session here', () => {
    expect(paired().admit(request('/', { cookie: 'nook_session_5001=session-1' }))).toEqual({ kind: 'pass', owner: false })
  })
})
