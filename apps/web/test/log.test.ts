import { describe, expect, test } from 'bun:test'

import { banner, readyLine, requestLine } from '../lib/log.ts'

const ESC = '\u001b'

describe('the log of the web server, in the format of Next.js', () => {
  test('the banner names the version of Next.js, the local address and the desks', () => {
    expect(banner({ version: '16.3.8', url: 'http://127.0.0.1:4321', desks: ['personal', 'chorus'], color: false })).toBe(
      '   ▲ Next.js 16.3.8\n   - Local:   http://127.0.0.1:4321\n   - Desks:   personal, chorus\n',
    )
  })

  test('the ready line gives the time to start in whole milliseconds', () => {
    expect(readyLine(412.7, false)).toBe(' ✓ Ready in 413ms')
  })

  test('a request line names the method, the path with no query string, the status and the time', () => {
    expect(requestLine({ method: 'GET', url: '/personal/works?t=secret-token', status: 200, ms: 12.4, color: false })).toBe(' GET /personal/works 200 in 12ms')
  })

  test('in a terminal, the status takes the color of its class, and with no terminal no line holds a color code', () => {
    expect(requestLine({ method: 'GET', url: '/', status: 200, ms: 1, color: true })).toContain(`${ESC}[32m200${ESC}[39m`)
    expect(requestLine({ method: 'GET', url: '/x', status: 404, ms: 1, color: true })).toContain(`${ESC}[33m404${ESC}[39m`)
    expect(requestLine({ method: 'POST', url: '/x', status: 500, ms: 1, color: true })).toContain(`${ESC}[31m500${ESC}[39m`)
    expect(readyLine(1, true)).toContain(`${ESC}[32m✓${ESC}[39m`)
    for (const line of [banner({ version: '1', url: 'u', desks: [], color: false }), readyLine(1, false), requestLine({ method: 'GET', url: '/', status: 500, ms: 1, color: false })])
      expect(line).not.toContain(ESC)
  })
})
