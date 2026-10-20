import { Check, FileText } from 'lucide-react'

import type { CourseView, CriterionTrend } from '@nook/learn/read.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@nook/ui/components/breadcrumb.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'
import { Section } from '@nook/ui/components/section.tsx'

import { Diagram } from '@/components/diagram.tsx'

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * The bands over the days with a score, one line for each criterion scored on every one of those days: the Bench line
 * needs a value at each point, and a chart never invents a score. The table above it gives every criterion.
 */
export function trendChart(trends: CriterionTrend[]): object | null {
  const days = [...new Set(trends.flatMap(t => t.points.map(p => p.date)))].sort()
  const bandOn = (trend: CriterionTrend, day: string) => trend.points.findLast(p => p.date === day)?.band
  const series = trends.filter(t => days.every(day => bandOn(t, day))).map(t => ({ name: t.criterion, values: days.map(day => Number(bandOn(t, day))) }))
  if (days.length < 2 || !series.length) return null
  const bands = series.flatMap(s => s.values)
  return { type: 'chart', kind: 'line', x: days, series, min: Math.max(0, Math.floor(Math.min(...bands)) - 1), max: Math.min(9, Math.ceil(Math.max(...bands)) + 1), step: 0.5 }
}

function Scores({ trends }: { trends: CriterionTrend[] }) {
  if (!trends.length) return <EmptyState compact icon={<Check className="size-5" aria-hidden="true" />} title="No score yet">The coach scores an answer in <CopyCommand text="/learn-practice" />.</EmptyState>
  const chart = trendChart(trends)
  return (
    <>
      <RecordList
        rows={trends.map(trend => {
          const last = trend.points.at(-1)!
          return { id: last.band, main: trend.criterion, sub: `last on ${last.date}, ${last.task} · ${count(trend.points.length, 'score')}` }
        })}
      />
      {chart ? <Diagram spec={chart as { type: string }} /> : null}
    </>
  )
}

/** A course: the cards due today, the top patterns of the owner's mistakes, and the bands of each criterion over time. */
export function CoursePage({ course, base }: { course: CourseView; base: string }) {
  return (
    <div className="mx-auto grid w-full max-w-[920px] gap-5">
      <header className="grid gap-2.5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href={`${base}/learn`}>Learn</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{course.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight">{course.name.charAt(0).toUpperCase() + course.name.slice(1)}</h1>
      </header>
      <Section title={`Cards due · ${course.due.length}`}>
        {course.due.length ? (
          <RecordList rows={course.due.map(card => ({ id: card.id, main: card.front, sub: card.back, end: <Badge variant="outline">box {card.box}</Badge> }))} />
        ) : (
          <EmptyState compact icon={<Check className="size-5" aria-hidden="true" />} title="No card due today">The next cards come back on their day.</EmptyState>
        )}
      </Section>
      <Section title="Top patterns of your mistakes">
        {course.patterns.length ? (
          <RecordList rows={course.patterns.map(p => ({ id: `${p.count}×`, main: p.pattern, sub: `last on ${p.last}` }))} />
        ) : (
          <EmptyState compact icon={<Check className="size-5" aria-hidden="true" />} title="No mistake logged yet">A study session logs each one in your own words.</EmptyState>
        )}
      </Section>
      <Section title="Scores by criterion">
        <Scores trends={course.trends} />
      </Section>
    </div>
  )
}

/** The courses of the desk, each a link to its page. */
export function Courses({ courses, base }: { courses: CourseView[]; base: string }) {
  if (!courses.length) return <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title="No course yet">Type <CopyCommand text="/learn-setup" /> in the agent session to start one.</EmptyState>
  return (
    <Section title="Courses">
      <RecordList rows={courses.map(c => ({ id: String(c.due.length), main: <a href={`${base}/learn/${c.name}`} className="hover:underline">{c.name}</a>, sub: `${count(c.due.length, 'card')} due · ${count(c.patterns.length, 'pattern')} · ${c.trends.length} scored ${c.trends.length === 1 ? 'criterion' : 'criteria'}` }))} />
    </Section>
  )
}
