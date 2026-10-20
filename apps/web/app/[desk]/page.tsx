import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { FlowMetrics } from '@/components/flow-metrics.tsx'
import { HomeBrief } from '@/components/home-brief.tsx'
import { orGap } from '@/components/gap.tsx'
import { home, metrics, openDesk } from '@/lib/desk.ts'

// each request reads the desk of its address, so one build serves every desk
export const dynamic = 'force-dynamic'

export default async function Home({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return orGap(() => (
    <>
      <PageHeader title="Home" description={`What waits for you in ${desk.name}, what runs, and how the last 30 days went.`} />
      <HomeBrief view={home(desk.dir)} base={desk.base} />
      <FlowMetrics metrics={metrics(desk.dir)} />
    </>
  ))
}
