import { orGap } from '../../components/Gap.tsx'
import { Courses } from '../../components/learn/CoursePage.tsx'
import { courses } from '../../lib/desk.ts'

export const dynamic = 'force-dynamic'

export default function Learn() {
  return orGap(() => <Courses courses={courses()} />)
}
