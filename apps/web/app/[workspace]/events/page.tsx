import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { EventsPage } from '@/components/workspace/events-page.tsx'
import { events, openWorkspace } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

const KINDS = ['block', 'error', 'prompt'] as const
const kindOf = (value: unknown) => KINDS.find(kind => kind === value)

type Props = { params: Promise<{ workspace: string }>; searchParams: Promise<{ kind?: string }> }

export default async function Events({ params, searchParams }: Props) {
  const workspace = await openWorkspace(params)
  const kind = kindOf((await searchParams).kind)
  return (
    <>
      <PageHeader title="Events" description="The log of this workspace, newest first: each block of a guard, each error of a hook, each prompt." />
      <EventsPage events={events(workspace.dir, kind ? { kind } : {})} kind={kind} base={workspace.base} now={new Date()} />
    </>
  )
}
