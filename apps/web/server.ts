import { createServer } from 'node:http'
import { join } from 'node:path'

import { createHandler } from './lib/handler.ts'

/** The server that `nook web` starts under Node: it reads the one-time token from stdin, then answers on 127.0.0.1 only. */

/** The first line of stdin: the token. nook web keeps stdin open, so its end means that nook web is gone. */
function firstLine(stream: NodeJS.ReadStream): Promise<string> {
  return new Promise(resolve => {
    let text = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk: string) => {
      text += chunk
      if (text.includes('\n')) resolve(text.slice(0, text.indexOf('\n')).trim())
    })
    stream.on('end', () => resolve(text.trim()))
  })
}

// the packages find the Nook repo by this variable: in the bundle of Next.js a file has no folder of its own
process.env.NOOK_PROJECT ??= join(import.meta.dirname, '..', '..')
const port = Number(process.env.NOOK_WEB_PORT)
if (!process.env.NOOK_DESK || !port) throw new Error('start the web app with `nook web`')
const token = await firstLine(process.stdin)
if (!token) throw new Error('no token came on stdin: start the web app with `nook web`')
process.stdin.on('end', () => process.exit(0))
const handler = await createHandler({ dir: import.meta.dirname, port, token })
createServer((req, res) => {
  handler(req, res).catch((error: unknown) => {
    console.error(error)
    res.statusCode = 500
    res.end('the page failed: see the terminal of `nook web`')
  })
}).listen(port, '127.0.0.1', () => console.log(`nook web: listening on 127.0.0.1:${port}`))
