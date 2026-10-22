import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { EventsPage } from '@/components/desk/events-page.tsx'
import { events, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

const KINDS = ['block', 'error', 'prompt'] as const
const kindOf = (value: unknown) => KINDS.find(kind => kind === value)

type Props = { params: Promise<{ desk: string }>; searchParams: Promise<{ kind?: string }> }

export default async function Events({ params, searchParams }: Props) {
  const desk = await openDesk(params)
  const kind = kindOf((await searchParams).kind)
  return (
    <>
      <PageHeader title="Events" description="The log of this desk, newest first: each block of a guard, each error of a hook, each prompt." />
      <EventsPage events={events(desk.dir, kind ? { kind } : {})} kind={kind} base={desk.base} now={new Date()} />
    </>
  )
}
