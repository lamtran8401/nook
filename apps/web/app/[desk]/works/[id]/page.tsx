import { orGap } from '@/components/gap.tsx'
import { ItemPage, tabOf } from '@/components/item/item-page.tsx'
import { item, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ desk: string; id: string }>; searchParams: Promise<{ tab?: string }> }

export default async function Item({ params, searchParams }: Props) {
  const desk = await openDesk(params)
  const { id } = await params
  const { tab } = await searchParams
  return orGap(() => {
    const { view, docs } = item(desk.dir, decodeURIComponent(id))
    return <ItemPage view={view} docs={docs} tab={tabOf(tab, docs)} now={new Date()} base={desk.base} />
  })
}
