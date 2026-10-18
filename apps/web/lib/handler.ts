import type { IncomingMessage, ServerResponse } from 'node:http'

import next from 'next'

import { Gate } from './gate.ts'

export type WebHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>

/** The request handler of the web app: the gate answers first, and Next.js renders only what the gate lets pass. */
export async function createHandler(options: { dir: string; port: number; token: string }): Promise<WebHandler> {
  const app = next({ dev: false, dir: options.dir, hostname: '127.0.0.1', port: options.port })
  const handle = app.getRequestHandler()
  await app.prepare()
  const gate = new Gate(options.token, options.port)
  return async (req, res) => {
    const decision = gate.admit({ method: req.method ?? 'GET', url: req.url ?? '/', headers: req.headers })
    if (decision.kind === 'login') {
      res.statusCode = 303
      res.setHeader('Set-Cookie', decision.cookie)
      res.setHeader('Location', decision.location)
      res.end()
      return
    }
    if (decision.kind === 'deny') {
      res.statusCode = decision.status
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(decision.reason)
      return
    }
    await handle(req, res)
  }
}
