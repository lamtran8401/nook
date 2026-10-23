import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { execFile } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Pairs } from '@nook/core/web/pairs.ts'
import { writeOpenPage } from '@nook/core/web/start.ts'

import { Gate, gateAnswer } from '../lib/gate.ts'
import { chromePath } from './layout-probe.ts'

let server: Server | null = null
let workspace: string
beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'nook-login-workspace-'))
})
afterEach(() => {
  server?.close()
  server = null
  rmSync(workspace, { recursive: true, force: true })
})

/**
 * The gate of the web app, on the pairs of a temporary workspace, in front of a page that says if the browser is paired;
 * on a free port of 127.0.0.1 for this test only. `redirect` answers the token with a 303, to show what a browser
 * does with it.
 */
async function serveGate(redirect: boolean): Promise<number> {
  let gate: Gate | null = null
  server = createServer((req, res) => {
    const decision = gate!.admit({ method: req.method ?? 'GET', url: req.url ?? '/', headers: req.headers })
    if (decision.kind === 'pass') return res.end(`<!doctype html><p id="paired">${decision.owner}</p>`)
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
  gate = new Gate(port, new Pairs(workspace))
  return port
}

/** What Chrome shows for `address`. Chrome runs apart from this process, so the server of the test can answer it. */
async function chrome(address: string): Promise<string> {
  const profile = mkdtempSync(join(tmpdir(), 'nook-login-chrome-'))
  try {
    const flags = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=5000', '--dump-dom']
    return await new Promise<string>((resolve, reject) => execFile(chromePath(), [...flags, address], { timeout: 60_000 }, (error, out) => (error ? reject(error) : resolve(out))))
  } finally {
    rmSync(profile, { recursive: true, force: true })
  }
}

/** The first open of `nook web`: through the page on the disk that holds a new pair token. */
async function openFromDisk(port: number): Promise<string> {
  const { dir, page } = writeOpenPage(`http://127.0.0.1:${port}/?t=${new Pairs(workspace).offer()}`)
  try {
    return await chrome(`file://${page}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('pairing a browser, in a real browser', () => {
  test('a 303 after the token loses the SameSite=Strict cookie, since a page on the disk started the navigation', async () => {
    expect(await openFromDisk(await serveGate(true))).toContain('<p id="paired">false</p>')
  })

  test('the first open of nook web pairs the browser: the login page moves to the address itself, on the same site', async () => {
    expect(await openFromDisk(await serveGate(false))).toContain('<p id="paired">true</p>')
  })

  test('the link of nook web pair, pasted in a second browser, pairs it', async () => {
    const port = await serveGate(false)
    expect(await chrome(`http://127.0.0.1:${port}/?t=${new Pairs(workspace).offer()}`)).toContain('<p id="paired">true</p>')
  })
})
