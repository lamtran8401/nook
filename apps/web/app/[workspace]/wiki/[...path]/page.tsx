import { orGap } from '@/components/gap.tsx'
import { ShelfPage, WikiLayout } from '@/components/wiki/wiki-home.tsx'
import { WikiPage } from '@/components/wiki/wiki-page.tsx'
import { openWorkspace, wiki, wikiPage } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

export default async function WikiPath({ params }: { params: Promise<{ workspace: string; path: string[] }> }) {
  const workspace = await openWorkspace(params)
  const path = (await params).path.map(decodeURIComponent).join('/')
  return orGap(() => {
    const view = wiki(workspace.dir)
    const shelf = view?.shelves.find(s => s.name === path)
    return (
      <WikiLayout wiki={view} current={path} base={workspace.base}>
        {shelf ? <ShelfPage shelf={shelf} base={workspace.base} /> : <WikiPage page={wikiPage(workspace.dir, path)} base={workspace.base} />}
      </WikiLayout>
    )
  })
}
