import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { MetricsPage } from '@/components/workspace/metrics-page.tsx'
import { orGap } from '@/components/gap.tsx'
import { blocks, metrics, openWorkspace, trend } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

export default async function Metrics({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await openWorkspace(params)
  return (
    <>
      <PageHeader title="Metrics" description={`How the flow of ${workspace.name} went in the last 30 days, and what the guards blocked.`} />
      {orGap(() => <MetricsPage metrics={metrics(workspace.dir)} trend={trend(workspace.dir) ?? []} blocks={blocks(workspace.dir)} />)}
    </>
  )
}
