import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { AgentsPage } from '@/components/desk/agents-page.tsx'
import { openDesk, parts } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ desk: string }> }

export default async function Agents({ params }: Props) {
  await openDesk(params)
  const all = parts()
  const count = (kind: string) => all.filter(part => part.kind === kind).length
  return (
    <>
      <PageHeader title="Agents and skills" description={`${count('agent')} agents and ${count('skill')} skills of the nook plugin: the agents that the session starts, and the skills you type.`} />
      <AgentsPage parts={all} />
    </>
  )
}
