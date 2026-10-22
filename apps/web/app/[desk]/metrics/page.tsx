import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { MetricsPage } from '@/components/desk/metrics-page.tsx'
import { orGap } from '@/components/gap.tsx'
import { blocks, metrics, openDesk, trend } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Metrics({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return (
    <>
      <PageHeader title="Metrics" description={`How the flow of ${desk.name} went in the last 30 days, and what the guards blocked.`} />
      {orGap(() => <MetricsPage metrics={metrics(desk.dir)} trend={trend(desk.dir) ?? []} blocks={blocks(desk.dir)} />)}
    </>
  )
}
