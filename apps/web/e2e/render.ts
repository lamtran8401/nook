// Calls the request handler of the web app under Node with requests made in memory: no port opens.
// Run: node render.ts <token>; NOOK_DESK names the desk. Prints the three answers as JSON.
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

const token = process.argv[2] ?? ''
const handler = await createHandler({ dir: join(import.meta.dirname, '..'), port: PORT, token })
const login = await call(handler, `/?t=${token}`, {})
const cookie = String(login.headers['set-cookie'] ?? '').split(';')[0] ?? ''
const page = await call(handler, '/', { cookie })
const stranger = await call(handler, '/', {})
console.log(JSON.stringify({ login: { status: login.status, location: login.headers.location, cookie }, page: { status: page.status, body: page.body }, stranger: { status: stranger.status } }))
process.exit(0)
