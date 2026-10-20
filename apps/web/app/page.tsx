import { FlowMetrics } from '@/components/flow-metrics.tsx'
import { HomeBrief } from '@/components/home-brief.tsx'
import { orGap } from '@/components/gap.tsx'
import { home, metrics } from '@/lib/desk.ts'

// each request reads the desk of NOOK_DESK, so one build serves every desk
export const dynamic = 'force-dynamic'

export default function Home() {
  return orGap(() => (
    <>
      <HomeBrief view={home()} />
      <FlowMetrics metrics={metrics()} />
    </>
  ))
}
