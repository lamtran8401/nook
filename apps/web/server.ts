import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { basename, join } from 'node:path'

import { Pairs } from '@nook/core/web/pairs.ts'

import { createHandler } from './lib/handler.ts'
import { banner, readyLine, requestLine } from './lib/log.ts'

/** The server that `nook web` starts under Node: it answers on 127.0.0.1 only, through the gate and the pairs of the desk. */

const started = performance.now()
const color = process.stdout.isTTY === true
const nextVersion = (JSON.parse(readFileSync(join(import.meta.dirname, 'node_modules', 'next', 'package.json'), 'utf8')) as { version: string }).version

// the packages find the Nook repo by this variable: in the bundle of Next.js a file has no folder of its own
process.env.NOOK_PROJECT ??= join(import.meta.dirname, '..', '..')
const port = Number(process.env.NOOK_WEB_PORT)
const desk = process.env.NOOK_DESK
if (!desk || !port) throw new Error('start the web app with `nook web`')
// nook web keeps stdin open, so its end means that nook web is gone
process.stdin.on('end', () => process.exit(0))
process.stdin.resume()
const handler = await createHandler({ dir: import.meta.dirname, port, pairs: new Pairs(desk) })
createServer((req, res) => {
  const begun = performance.now()
  res.once('finish', () => console.log(requestLine({ method: req.method ?? 'GET', url: req.url ?? '/', status: res.statusCode, ms: performance.now() - begun, color })))
  handler(req, res).catch((error: unknown) => {
    console.error(error)
    res.statusCode = 500
    res.end('the page failed: see the terminal of `nook web`')
  })
}).listen(port, '127.0.0.1', () => {
  console.log(banner({ version: nextVersion, url: `http://127.0.0.1:${port}`, desks: [basename(desk)], color }))
  console.log(readyLine(performance.now() - started, color))
})
