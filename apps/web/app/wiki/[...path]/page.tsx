import { orGap } from '@/components/gap.tsx'
import { ShelfPage } from '@/components/wiki/wiki-home.tsx'
import { WikiPage } from '@/components/wiki/wiki-page.tsx'
import { wiki, wikiPage } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function WikiPath({ params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.map(decodeURIComponent).join('/')
  return orGap(() => {
    const shelf = wiki()?.shelves.find(s => s.name === path)
    return shelf ? <ShelfPage shelf={shelf} /> : <WikiPage page={wikiPage(path)} />
  })
}
