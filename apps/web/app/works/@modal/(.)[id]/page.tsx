import { DialogFrame } from '../../../../components/DialogFrame.tsx'
import { orGap } from '../../../../components/Gap.tsx'
import { ItemDialog } from '../../../../components/item/ItemDialog.tsx'
import { itemView } from '../../../../lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function ItemOverBoard({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id)
  return <DialogFrame label={id}>{orGap(() => <ItemDialog view={itemView(id)} />)}</DialogFrame>
}
