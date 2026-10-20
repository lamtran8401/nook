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
      <HomeBrief view={home(desk.dir)} base={desk.base} />
      <FlowMetrics metrics={metrics(desk.dir)} />
    </>
  ))
}
