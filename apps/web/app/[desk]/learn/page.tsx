import { orGap } from '@/components/gap.tsx'
import { Courses } from '@/components/learn/course-page.tsx'
import { courses, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Learn({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return orGap(() => <Courses courses={courses(desk.dir)} base={desk.base} />)
}
