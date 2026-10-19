import { orGap } from '@/components/Gap.tsx'
import { WikiHome } from '@/components/wiki/WikiHome.tsx'
import { wiki } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default function Wiki() {
  return orGap(() => <WikiHome wiki={wiki()} />)
}
