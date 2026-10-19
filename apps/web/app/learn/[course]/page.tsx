import { FileText } from 'lucide-react'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { orGap } from '@/components/gap.tsx'
import { CoursePage } from '@/components/learn/course-page.tsx'
import { courses } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

export default async function Course({ params }: { params: Promise<{ course: string }> }) {
  const name = decodeURIComponent((await params).course)
  return orGap(() => {
    const course = courses().find(c => c.name === name)
    return course ? <CoursePage course={course} /> : <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title={`No course is named ${name}`}>Open a course from the list on Learn.</EmptyState>
  })
}
