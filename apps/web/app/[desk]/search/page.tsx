import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { SearchResults } from '@/components/search-results.tsx'
import { find, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ desk: string }>; searchParams: Promise<{ q?: string }> }

export default async function Search({ params, searchParams }: Props) {
  const desk = await openDesk(params)
  const query = (await searchParams).q ?? ''
  return (
    <>
      <PageHeader title="Search" description="The lines of the wiki, the items and the courses that hold every word." />
      {orGap(() => <SearchResults query={query} hits={find(desk.dir, query, desk.base)} />)}
    </>
  )
}
