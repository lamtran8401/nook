import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { orGap } from '@/components/gap.tsx'
import { Courses } from '@/components/learn/course-page.tsx'
import { courses, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Learn({ params }: { params: Promise<{ desk: string }> }) {
  const desk = await openDesk(params)
  return (
    <>
      <PageHeader title="Learn" description="Your courses: the cards due today, your mistakes and your scores." />
      {orGap(() => <Courses courses={courses(desk.dir)} base={desk.base} />)}
    </>
  )
}
