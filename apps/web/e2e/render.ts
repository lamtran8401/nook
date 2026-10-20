// Calls the request handler of the web app under Node with requests made in memory: no port opens.
// Run: node render.ts; NOOK_DESK names the desk, which gets one pair token. Prints the answers as JSON.
import { IncomingMessage, type OutgoingHttpHeaders, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { join } from 'node:path'

import { Pairs } from '@nook/core/web/pairs.ts'

import { listDesks } from '../lib/desks.ts'
import { createHandler, type WebHandler } from '../lib/handler.ts'

const PORT = 4321
type Answer = { status: number; headers: OutgoingHttpHeaders; body: string }

async function call(handler: WebHandler, url: string, headers: Record<string, string>, method = 'GET'): Promise<Answer> {
  const req = new IncomingMessage(new Socket())
  Object.assign(req, { method, url, headers: { host: `127.0.0.1:${PORT}`, ...headers } })
  req.push(null)
  const res = new ServerResponse(req)
  const chunks: Buffer[] = []
  const done = new Promise<void>(resolve => {
    res.write = ((chunk: string | Uint8Array) => (chunks.push(Buffer.from(chunk)), true)) as typeof res.write
    res.end = ((chunk?: unknown) => {
      if (typeof chunk === 'string' || chunk instanceof Uint8Array) chunks.push(Buffer.from(chunk))
      resolve()
      return res
    }) as typeof res.end
  })
  await handler(req, res)
  await done
  return { status: res.statusCode, headers: res.getHeaders(), body: Buffer.concat(chunks).toString('utf8') }
}

// the packages find the Nook repo by this variable: in the bundle of Next.js a file has no folder of its own
process.env.NOOK_PROJECT ??= join(import.meta.dirname, '..', '..', '..')
const pairs = new Pairs(process.env.NOOK_DESK ?? '')
const token = pairs.offer()
const handler = await createHandler({ dir: join(import.meta.dirname, '..'), port: PORT, pairs })
const login = await call(handler, `/?t=${token}`, {})
const cookie = String(login.headers['set-cookie'] ?? '').split(';')[0] ?? ''
const base = `/${listDesks()[0]!.slug}`
const root = await call(handler, '/', { cookie })
const home = await call(handler, base, { cookie })
const page = await call(handler, `${base}/works`, { cookie })
const item = await call(handler, `${base}/works/SHOP-12?tab=walkthrough`, { cookie })
const ghost = await call(handler, '/ghost/works', { cookie })
// the request of the client router after a click on a card of the board: Next renders the dialog slot
const routerHeaders = { cookie, rsc: '1', 'next-url': `${base}/works` }
const asked = await call(handler, `${base}/works/SHOP-12`, routerHeaders)
// Next sends the router to the same address with the cache key of these headers first
const dialog = asked.status === 307 ? await call(handler, String(asked.headers.location), routerHeaders) : asked
const again = await call(handler, `/?t=${token}`, {})
const stranger = await call(handler, `${base}/works/SHOP-12`, {})
const strangerWrite = await call(handler, `${base}/works/SHOP-12`, { origin: `http://127.0.0.1:${PORT}` }, 'POST')
const plain = ({ status, body }: Answer) => ({ status, body })
console.log(JSON.stringify({ base, root: { status: root.status, location: String(root.headers.location ?? '') }, ghost: plain(ghost), login: { ...plain(login), cookie }, again: plain(again), home: plain(home), page: plain(page), item: plain(item), dialog: plain(dialog), stranger: plain(stranger), strangerWrite: plain(strangerWrite) }))
process.exit(0)
