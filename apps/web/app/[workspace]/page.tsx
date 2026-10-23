import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { Inbox } from '@/components/inbox.tsx'
import { board, home, itemView, metrics, openWorkspace, receipts, trend } from '@/lib/workspace.ts'
import { greeting, summary } from '@/lib/inbox.ts'

// each request reads the workspace of its address, so one build serves every workspace
export const dynamic = 'force-dynamic'

const startOfToday = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate())

export default async function Home({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await openWorkspace(params)
  return orGap(() => {
    const now = new Date()
    const { brief } = home(workspace.dir)
    const flow = metrics(workspace.dir)
    // an answer row takes its words in place, so it needs the open questions of its item
    const asking = [...new Set(brief.filter(line => line.part === 'waits' && line.action?.startsWith('nook eng answer ')).flatMap(line => (line.item ? [line.item.id] : [])))]
    return (
      <>
        <PageHeader title={greeting(now)} description={summary(brief)} />
        <Inbox
          brief={brief}
          questions={asking.flatMap(id => itemView(workspace.dir, id).needs.questions)}
          metrics={flow}
          trend={trend(workspace.dir)}
          receipts={flow ? receipts(workspace.dir, startOfToday(now)) : []}
          cards={flow ? board(workspace.dir) : []}
          base={workspace.base}
        />
      </>
    )
  })
}
