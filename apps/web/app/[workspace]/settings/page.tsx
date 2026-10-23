import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { SettingsPage } from '@/components/workspace/settings-page.tsx'
import { orGap } from '@/components/gap.tsx'
import { openWorkspace, settings } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

export default async function Settings({ params }: { params: Promise<{ workspace: string }> }) {
  const workspace = await openWorkspace(params)
  return (
    <>
      <PageHeader title="Settings" description={`The setup of ${workspace.name}, as its nook.yml and its ledger hold it. /setup changes it.`} />
      {orGap(() => <SettingsPage settings={settings(workspace.dir)} />)}
    </>
  )
}
