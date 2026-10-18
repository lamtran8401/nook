// Calls the request handler of the web app under Node with requests made in memory: no port opens.
// Run: node render.ts <token>; NOOK_DESK names the desk. Prints the answers as JSON.
import { IncomingMessage, type OutgoingHttpHeaders, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { join } from 'node:path'

import { createHandler, type WebHandler } from '../lib/handler.ts'

const PORT = 4321
type Answer = { status: number; headers: OutgoingHttpHeaders; body: string }

async function call(handler: WebHandler, url: string, headers: Record<string, string>): Promise<Answer> {
  const req = new IncomingMessage(new Socket())
  Object.assign(req, { method: 'GET', url, headers: { host: `127.0.0.1:${PORT}`, ...headers } })
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
const token = process.argv[2] ?? ''
const handler = await createHandler({ dir: join(import.meta.dirname, '..'), port: PORT, token })
const login = await call(handler, `/?t=${token}`, {})
const cookie = String(login.headers['set-cookie'] ?? '').split(';')[0] ?? ''
const home = await call(handler, '/', { cookie })
const page = await call(handler, '/works', { cookie })
const item = await call(handler, '/works/SHOP-12?tab=walkthrough', { cookie })
// the request of the client router after a click on a card of the board: Next renders the dialog slot
const routerHeaders = { cookie, rsc: '1', 'next-url': '/works' }
const asked = await call(handler, '/works/SHOP-12', routerHeaders)
// Next sends the router to the same address with the cache key of these headers first
const dialog = asked.status === 307 ? await call(handler, String(asked.headers.location), routerHeaders) : asked
const stranger = await call(handler, '/', {})
console.log(JSON.stringify({ login: { status: login.status, location: login.headers.location, cookie }, home: { status: home.status, body: home.body }, page: { status: page.status, body: page.body }, item: { status: item.status, body: item.body }, dialog: { status: dialog.status, body: dialog.body }, stranger: { status: stranger.status } }))
process.exit(0)
