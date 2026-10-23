import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { SearchResults } from '@/components/search-results.tsx'
import { find, openWorkspace } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ workspace: string }>; searchParams: Promise<{ q?: string }> }

export default async function Search({ params, searchParams }: Props) {
  const workspace = await openWorkspace(params)
  const query = (await searchParams).q ?? ''
  return (
    <>
      <PageHeader title="Search" description="The lines of the wiki, the items and the courses that hold every word." />
      {orGap(() => <SearchResults query={query} hits={find(workspace.dir, query, workspace.base)} />)}
    </>
  )
}
