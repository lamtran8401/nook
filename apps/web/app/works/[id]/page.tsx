import { orGap } from '@/components/gap.tsx'
import { ItemPage, tabOf } from '@/components/item/item-page.tsx'
import { item } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }

export default async function Item({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  return orGap(() => <ItemPage {...item(decodeURIComponent(id))} tab={tabOf(tab)} now={new Date()} />)
}
