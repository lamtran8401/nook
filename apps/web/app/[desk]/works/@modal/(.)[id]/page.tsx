import { orGap } from '@/components/gap.tsx'
import { ItemDialog } from '@/components/item/item-dialog.tsx'
import { ItemModal } from '@/components/item/item-modal.tsx'
import { itemView, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function ItemOverBoard({ params }: { params: Promise<{ desk: string; id: string }> }) {
  const desk = await openDesk(params)
  const id = decodeURIComponent((await params).id)
  return <ItemModal label={id}>{orGap(() => <ItemDialog view={itemView(desk.dir, id)} base={desk.base} />)}</ItemModal>
}
