import { EmptyState } from '@/components/EmptyState.tsx'
import { orGap } from '@/components/Gap.tsx'
import { CoursePage } from '@/components/learn/CoursePage.tsx'
import { courses } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Course({ params }: { params: Promise<{ course: string }> }) {
  const name = decodeURIComponent((await params).course)
  return orGap(() => {
    const course = courses().find(c => c.name === name)
    return course ? <CoursePage course={course} /> : <EmptyState icon="file" title={`No course is named ${name}`}>Open a course from the list on Learn.</EmptyState>
  })
}
