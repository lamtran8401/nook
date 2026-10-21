import { orGap } from '@/components/gap.tsx'
import { ItemDrawer } from '@/components/item/item-drawer.tsx'
import { ItemPanel } from '@/components/item/item-panel.tsx'
import { item, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function ItemOverBoard({ params }: { params: Promise<{ desk: string; id: string }> }) {
  const desk = await openDesk(params)
  const id = decodeURIComponent((await params).id)
  return <ItemDrawer label={id}>{orGap(() => <ItemPanel {...item(desk.dir, id)} now={new Date()} base={desk.base} />)}</ItemDrawer>
}
