import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { Inbox } from '@/components/inbox.tsx'
import { board, home, itemView, metrics, openDesk, receipts, trend } from '@/lib/desk.ts'
import { greeting, summary } from '@/lib/inbox.ts'

// each request reads the desk of its address, so one build serves every desk
export const dynamic = 'force-dynamic'

const startOfToday = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate())

export default async function Home({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return orGap(() => {
    const now = new Date()
    const { brief } = home(desk.dir)
    const flow = metrics(desk.dir)
    // an answer row takes its words in place, so it needs the open questions of its item
    const asking = [...new Set(brief.filter(line => line.part === 'waits' && line.action?.startsWith('nook eng answer ')).flatMap(line => (line.item ? [line.item.id] : [])))]
    return (
      <>
        <PageHeader title={greeting(now)} description={summary(brief)} />
        <Inbox
          brief={brief}
          questions={asking.flatMap(id => itemView(desk.dir, id).needs.questions)}
          metrics={flow}
          trend={trend(desk.dir)}
          receipts={flow ? receipts(desk.dir, startOfToday(now)) : []}
          cards={flow ? board(desk.dir) : []}
          base={desk.base}
        />
      </>
    )
  })
}
