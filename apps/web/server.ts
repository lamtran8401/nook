import { createServer } from 'node:http'

import { createHandler } from './lib/handler.ts'

/** The server that `nook web` starts under Node: it reads the one-time token from stdin, then answers on 127.0.0.1 only. */

async function firstLine(stream: NodeJS.ReadableStream): Promise<string> {
  let text = ''
  for await (const chunk of stream) {
    text += String(chunk)
    const end = text.indexOf('\n')
    if (end >= 0) return text.slice(0, end).trim()
  }
  return text.trim()
}

const port = Number(process.env.NOOK_WEB_PORT)
if (!process.env.NOOK_DESK || !port) throw new Error('start the web app with `nook web`')
const handler = await createHandler({ dir: import.meta.dirname, port, token: await firstLine(process.stdin) })
createServer((req, res) => {
  handler(req, res).catch((error: unknown) => {
    console.error(error)
    res.statusCode = 500
    res.end('the page failed: see the terminal of `nook web`')
  })
}).listen(port, '127.0.0.1', () => console.log(`nook web: listening on 127.0.0.1:${port}`))
