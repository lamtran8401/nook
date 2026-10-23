import { createServer } from 'node:net'

/** A free port on 127.0.0.1: the preferred one, such as the last port of the workspace, when it is free. */
export async function freePort(preferred?: number): Promise<number> {
  if (preferred && (await listens(preferred))) return preferred
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

function listens(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
  })
}
