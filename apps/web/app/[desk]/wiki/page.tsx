import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { WikiHome } from '@/components/wiki/wiki-home.tsx'
import { openDesk, wiki } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Wiki({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return (
    <>
      <PageHeader title="Wiki" description="What lasts in this desk: each shelf with its pages, and the drafts that wait for your yes." />
      {orGap(() => <WikiHome wiki={wiki(desk.dir)} base={desk.base} />)}
    </>
  )
}
