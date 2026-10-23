import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { WikiHome, WikiLayout } from '@/components/wiki/wiki-home.tsx'
import { openWorkspace, wiki } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

export default async function Wiki({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await openWorkspace(params)
  return (
    <>
      <PageHeader title="Wiki" description="What lasts in this workspace: each shelf with its pages, and the drafts that wait for your yes." />
      {orGap(() => {
        const view = wiki(workspace.dir)
        return (
          <WikiLayout wiki={view} base={workspace.base}>
            <WikiHome wiki={view} base={workspace.base} />
          </WikiLayout>
        )
      })}
    </>
  )
}
