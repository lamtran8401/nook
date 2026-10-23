import { orGap } from '@/components/gap.tsx'
import { ItemPage, tabOf } from '@/components/item/item-page.tsx'
import { item, openWorkspace } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ workspace: string; id: string }>; searchParams: Promise<{ tab?: string }> }

export default async function Item({ params, searchParams }: Props) {
  const workspace = await openWorkspace(params)
  const { id } = await params
  const { tab } = await searchParams
  return orGap(() => {
    const { view, docs } = item(workspace.dir, decodeURIComponent(id))
    return <ItemPage view={view} docs={docs} tab={tabOf(tab, docs)} now={new Date()} base={workspace.base} />
  })
}
