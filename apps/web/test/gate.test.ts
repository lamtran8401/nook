import { describe, expect, test } from 'bun:test'

import { Gate, type GateRequest } from '../lib/gate.ts'

const PORT = 4321
const HOST = `127.0.0.1:${PORT}`
let clock = 0
const gate = (token = 'token-abc') => {
  let n = 0
  clock = 0
  return new Gate(token, PORT, { newId: () => `session-${++n}`, now: () => clock })
}
const request = (url: string, headers: GateRequest['headers'] = {}, method = 'GET'): GateRequest => ({ method, url, headers: { host: HOST, ...headers } })

describe('Gate', () => {
  test('the first open with the token sets the session cookie and drops the token from the address', () => {
    expect(gate().admit(request('/works?t=token-abc&tab=plan'))).toEqual({
      kind: 'login',
      cookie: 'nook_session_4321=session-1; HttpOnly; SameSite=Strict; Path=/',
      location: '/works?tab=plan',
    })
  })

  test('the token works once', () => {
    const g = gate()
    g.admit(request('/?t=token-abc'))
    expect(g.admit(request('/?t=token-abc'))).toMatchObject({ kind: 'deny', status: 401 })
  })

  test('a wrong token is refused', () => {
    expect(gate().admit(request('/?t=token-xyz'))).toMatchObject({ kind: 'deny', status: 401 })
  })

  test('a request with the session cookie passes, and one with none or another is refused', () => {
    const g = gate()
    g.admit(request('/?t=token-abc'))
    expect(g.admit(request('/works', { cookie: 'theme=dark; nook_session_4321=session-1' }))).toEqual({ kind: 'pass' })
    expect(g.admit(request('/works'))).toMatchObject({ kind: 'deny', status: 401 })
    expect(g.admit(request('/works', { cookie: 'nook_session_4321=session-9' }))).toMatchObject({ kind: 'deny', status: 401 })
  })

  test('a write passes only from the origin of the page', () => {
    const g = gate()
    g.admit(request('/?t=token-abc'))
    const cookie = 'nook_session_4321=session-1'
    expect(g.admit(request('/works/SHOP-12', { cookie, origin: `http://${HOST}` }, 'POST'))).toEqual({ kind: 'pass' })
    expect(g.admit(request('/works/SHOP-12', { cookie, origin: 'http://evil.test' }, 'POST'))).toMatchObject({ kind: 'deny', status: 403 })
    expect(g.admit(request('/works/SHOP-12', { cookie }, 'POST'))).toMatchObject({ kind: 'deny', status: 403 })
  })

  test('a request for another host is refused, so a renamed address cannot reach the server', () => {
    expect(gate().admit({ method: 'GET', url: '/?t=token-abc', headers: { host: `evil.test:${PORT}` } })).toMatchObject({ kind: 'deny', status: 403 })
  })

  test('an empty token never logs in', () => {
    expect(gate('').admit(request('/?t='))).toMatchObject({ kind: 'deny', status: 401 })
  })

  test('the token stops working two minutes after the start', () => {
    const g = gate()
    clock = 120_001
    expect(g.admit(request('/?t=token-abc'))).toMatchObject({ kind: 'deny', status: 401 })
  })

  test('a request with a valid cookie passes, also when its address has its own t', () => {
    const g = gate()
    g.admit(request('/?t=token-abc'))
    expect(g.admit(request('/search?t=wiki', { cookie: 'nook_session_4321=session-1' }))).toEqual({ kind: 'pass' })
  })

  test('the cookie of another port does not open this server', () => {
    const g = gate()
    g.admit(request('/?t=token-abc'))
    expect(g.admit(request('/', { cookie: 'nook_session_5001=session-1' }))).toMatchObject({ kind: 'deny', status: 401 })
  })
})
