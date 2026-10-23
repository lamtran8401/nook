import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { AgentsPage } from '@/components/workspace/agents-page.tsx'
import { openWorkspace, parts } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ workspace: string }> }

export default async function Agents({ params }: Props) {
  await openWorkspace(params)
  const all = parts()
  const count = (kind: string) => all.filter(part => part.kind === kind).length
  return (
    <>
      <PageHeader title="Agents and skills" description={`${count('agent')} agents and ${count('skill')} skills of the nook plugin: the agents that the session starts, and the skills you type.`} />
      <AgentsPage parts={all} />
    </>
  )
}
