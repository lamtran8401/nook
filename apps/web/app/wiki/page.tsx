import { orGap } from '@/components/gap.tsx'
import { WikiHome } from '@/components/wiki/wiki-home.tsx'
import { wiki } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default function Wiki() {
  return orGap(() => <WikiHome wiki={wiki()} />)
}
