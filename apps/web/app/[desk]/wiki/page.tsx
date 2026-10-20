import { orGap } from '@/components/gap.tsx'
import { WikiHome } from '@/components/wiki/wiki-home.tsx'
import { openDesk, wiki } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Wiki({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return orGap(() => <WikiHome wiki={wiki(desk.dir)} base={desk.base} />)
}
