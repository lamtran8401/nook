import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { HarnessPage } from '@/components/workspace/harness-page.tsx'
import { orGap } from '@/components/gap.tsx'
import { harness, openWorkspace } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

export default async function Harness({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await openWorkspace(params)
  return (
    <>
      <PageHeader title="Harness" description={`How Nook works in ${workspace.name}: its features, its agent budget and its guards, as nook.yml sets them.`} />
      {orGap(() => <HarnessPage harness={harness(workspace.dir)} />)}
    </>
  )
}
