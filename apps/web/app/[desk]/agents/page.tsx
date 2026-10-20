import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { AgentsPage } from '@/components/desk/agents-page.tsx'
import { openDesk, parts } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Agents({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return (
    <>
      <PageHeader title="Agents and skills" description="What the packs of this desk give the agent session: the agents it starts and the skills you type." />
      <AgentsPage parts={parts(desk.dir)} />
    </>
  )
}
