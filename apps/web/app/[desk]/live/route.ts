import { deskBySlug } from '@/lib/desks.ts'
import { watchDesk } from '@/lib/watch.ts'

export const dynamic = 'force-dynamic'

const KEEP_ALIVE_MS = 25_000

/** The changes of the desk of the address as server-sent events; the page refreshes on each one. The stream ends when the page goes. */
export async function GET(request: Request, { params }: { params: Promise<{ desk: string }> }): Promise<Response> {
  const desk = deskBySlug((await params).desk)
  if (!desk) return new Response('no such desk', { status: 404 })
  const encoder = new TextEncoder()
  let stop = () => {}
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text))
      send(': live\n\n')
      const stopWatch = watchDesk(desk.dir, () => send('event: change\ndata: {}\n\n'))
      const alive = setInterval(() => send(': alive\n\n'), KEEP_ALIVE_MS)
      stop = () => {
        clearInterval(alive)
        stopWatch()
      }
      request.signal.addEventListener('abort', () => {
        stop()
        controller.close()
      })
    },
    cancel() {
      stop()
    },
  })
  return new Response(stream, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } })
}
