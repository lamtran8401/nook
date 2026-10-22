import { orGap } from '@/components/gap.tsx'
import { ShelfPage, WikiLayout } from '@/components/wiki/wiki-home.tsx'
import { WikiPage } from '@/components/wiki/wiki-page.tsx'
import { openDesk, wiki, wikiPage } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function WikiPath({ params }: { params: Promise<{ desk: string; path: string[] }> }) {
  const desk = await openDesk(params)
  const path = (await params).path.map(decodeURIComponent).join('/')
  return orGap(() => {
    const view = wiki(desk.dir)
    const shelf = view?.shelves.find(s => s.name === path)
    return (
      <WikiLayout wiki={view} current={path} base={desk.base}>
        {shelf ? <ShelfPage shelf={shelf} base={desk.base} /> : <WikiPage page={wikiPage(desk.dir, path)} base={desk.base} />}
      </WikiLayout>
    )
  })
}
