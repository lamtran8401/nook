import { orGap } from '@/components/gap.tsx'
import { ItemDialog } from '@/components/item/item-dialog.tsx'
import { ItemModal } from '@/components/item/item-modal.tsx'
import { itemView } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function ItemOverBoard({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id)
  return <ItemModal label={id}>{orGap(() => <ItemDialog view={itemView(id)} />)}</ItemModal>
}
