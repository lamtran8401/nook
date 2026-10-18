import type { IncomingMessage, ServerResponse } from 'node:http'

import next from 'next'

import { Gate, gateAnswer } from './gate.ts'

export type WebHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>

/** The request handler of the web app: the gate answers first, and Next.js renders only what the gate lets pass. */
export async function createHandler(options: { dir: string; port: number; token: string }): Promise<WebHandler> {
  const app = next({ dev: false, dir: options.dir, hostname: '127.0.0.1', port: options.port })
  const handle = app.getRequestHandler()
  await app.prepare()
  const gate = new Gate(options.token, options.port)
  return async (req, res) => {
    const decision = gate.admit({ method: req.method ?? 'GET', url: req.url ?? '/', headers: req.headers })
    if (decision.kind === 'pass') return handle(req, res)
    const answer = gateAnswer(decision)
    res.statusCode = answer.status
    for (const [name, value] of Object.entries(answer.headers)) res.setHeader(name, value)
    res.end(answer.body)
  }
}
