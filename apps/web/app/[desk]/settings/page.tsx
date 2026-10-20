import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { SettingsPage } from '@/components/desk/settings-page.tsx'
import { orGap } from '@/components/gap.tsx'
import { openDesk, settings } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Settings({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return (
    <>
      <PageHeader title="Settings" description={`The setup of ${desk.name}, as its nook.yml and its ledger hold it. /setup changes it.`} />
      {orGap(() => <SettingsPage settings={settings(desk.dir)} />)}
    </>
  )
}
