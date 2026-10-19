import { orGap } from '@/components/gap.tsx'
import { Courses } from '@/components/learn/course-page.tsx'
import { courses } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default function Learn() {
  return orGap(() => <Courses courses={courses()} />)
}
