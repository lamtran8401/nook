import { afterEach, describe, expect, test } from 'bun:test'
import { execFile } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { writeOpenPage } from '@nook/core/web/start.ts'

import { Gate, gateAnswer } from '../lib/gate.ts'
import { chromePath } from './layout-probe.ts'

const TOKEN = 'token-login-e2e'

let server: Server | null = null
afterEach(() => {
  server?.close()
  server = null
})

/**
 * The gate of the web app in front of a page that says "inside", on a free port of 127.0.0.1 for this test only.
 * `redirect` answers the token with the 303 of the first version, to show what a browser does with it.
 */
async function serveGate(redirect: boolean): Promise<number> {
  let gate: Gate | null = null
  server = createServer((req, res) => {
    const decision = gate!.admit({ method: req.method ?? 'GET', url: req.url ?? '/', headers: req.headers })
    if (decision.kind === 'pass') return res.end('<!doctype html><p id="where">inside</p>')
    if (redirect && decision.kind === 'login') {
      res.writeHead(303, { 'Set-Cookie': decision.cookie, Location: decision.location })
      return res.end()
    }
    const answer = gateAnswer(decision)
    res.writeHead(answer.status, answer.headers)
    res.end(answer.body)
  })
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
  const port = (server!.address() as AddressInfo).port
  gate = new Gate(TOKEN, port)
  return port
}

/**
 * What the browser shows after `nook web` opens it through the page on the disk that holds the token. Chrome runs
 * apart from this process, so the server of the test can answer it.
 */
async function openInChrome(port: number): Promise<string> {
  const { dir, page } = writeOpenPage(`http://127.0.0.1:${port}/?t=${TOKEN}`)
  const profile = mkdtempSync(join(tmpdir(), 'nook-login-chrome-'))
  try {
    const flags = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=5000', '--dump-dom']
    return await new Promise<string>((resolve, reject) => execFile(chromePath(), [...flags, `file://${page}`], { timeout: 60_000 }, (error, out) => (error ? reject(error) : resolve(out))))
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(profile, { recursive: true, force: true })
  }
}

describe('the first open of nook web in a real browser', () => {
  test('a 303 after the token loses the SameSite=Strict cookie, since a page on the disk started the navigation', async () => {
    expect(await openInChrome(await serveGate(true))).toContain('open the web app with `nook web`')
  })

  test('the login page of the gate keeps the cookie: it moves to the address itself, on the same site', async () => {
    expect(await openInChrome(await serveGate(false))).toContain('<p id="where">inside</p>')
  })
})
