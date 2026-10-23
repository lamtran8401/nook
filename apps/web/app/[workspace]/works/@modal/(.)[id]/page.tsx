import { orGap } from '@/components/gap.tsx'
import { ItemDrawer } from '@/components/item/item-drawer.tsx'
import { ItemPanel } from '@/components/item/item-panel.tsx'
import { item, openWorkspace } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

export default async function ItemOverBoard({ params }: { params: Promise<{ workspace: string; id: string }> }) {
  const workspace = await openWorkspace(params)
  const id = decodeURIComponent((await params).id)
  return <ItemDrawer label={id}>{orGap(() => <ItemPanel {...item(workspace.dir, id)} now={new Date()} base={workspace.base} />)}</ItemDrawer>
}
