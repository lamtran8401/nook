import { createServer } from 'node:http'
import { join } from 'node:path'

import { Pairs } from '@nook/core/web/pairs.ts'

import { createHandler } from './lib/handler.ts'

/** The server that `nook web` starts under Node: it answers on 127.0.0.1 only, through the gate and the pairs of the desk. */

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
  handler(req, res).catch((error: unknown) => {
    console.error(error)
    res.statusCode = 500
    res.end('the page failed: see the terminal of `nook web`')
  })
}).listen(port, '127.0.0.1', () => console.log(`nook web: listening on 127.0.0.1:${port}`))
