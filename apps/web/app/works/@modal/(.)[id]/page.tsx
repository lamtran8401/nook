import { orGap } from '@/components/Gap.tsx'
import { ItemDialog } from '@/components/item/ItemDialog.tsx'
import { ItemModal } from '@/components/item/ItemModal.tsx'
import { itemView } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function ItemOverBoard({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id)
  return <ItemModal label={id}>{orGap(() => <ItemDialog view={itemView(id)} />)}</ItemModal>
}
