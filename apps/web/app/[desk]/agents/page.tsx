import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { AgentsPage, packsOf } from '@/components/desk/agents-page.tsx'
import { openDesk, parts } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ desk: string }>; searchParams: Promise<{ pack?: string }> }

export default async function Agents({ params, searchParams }: Props) {
  const desk = await openDesk(params)
  const all = parts(desk.dir)
  const asked = (await searchParams).pack
  const pack = packsOf(all).find(name => name === asked)
  const count = (kind: string) => all.filter(part => part.kind === kind).length
  return (
    <>
      <PageHeader title="Agents and skills" description={`${count('agent')} agents and ${count('skill')} skills from the packs on this desk: the agents that the session starts, and the skills you type.`} />
      <AgentsPage parts={all} pack={pack} base={desk.base} />
    </>
  )
}
