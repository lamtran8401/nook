import { orGap } from '@/components/Gap.tsx'
import { SearchResults } from '@/components/SearchResults.tsx'
import { find } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q ?? ''
  return orGap(() => <SearchResults query={query} hits={find(query)} />)
}
