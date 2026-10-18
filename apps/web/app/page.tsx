import { HomeBrief } from '../components/HomeBrief.tsx'
import { orGap } from '../components/Gap.tsx'
import { home } from '../lib/desk.ts'

// each request reads the desk of NOOK_DESK, so one build serves every desk
export const dynamic = 'force-dynamic'

export default function Home() {
  return orGap(() => <HomeBrief view={home()} />)
}
