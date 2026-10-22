import { Check, FileText, GraduationCap } from 'lucide-react'

import type { CourseView, CriterionTrend } from '@nook/learn/read.ts'
import { Badge } from '@nook/ui/components/badge.tsx'
import { CopyCommand } from '@nook/ui/components/copy-command.tsx'
import { EmptyState } from '@nook/ui/components/empty-state.tsx'
import { IconCard } from '@nook/ui/components/icon-card.tsx'
import { RecordList } from '@nook/ui/components/record-list.tsx'
import { Tile } from '@nook/ui/components/tile.tsx'

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

/** A course on tiles: the cards due today, the top patterns of the owner's mistakes, and the bands of each criterion over time. */
export function CoursePage({ course }: { course: CourseView }) {
  return (
    <div className="grid gap-3">
      <h1 className="text-[26px] leading-[34px] font-bold tracking-tight">{course.name.charAt(0).toUpperCase() + course.name.slice(1)}</h1>
      <div className="grid items-start gap-3 md:grid-cols-2">
        <Tile title="Cards due" note={course.due.length}>
          {course.due.length ? (
            <RecordList rows={course.due.map(card => ({ id: card.id, main: card.front, sub: card.back, end: <Badge variant="outline">box {card.box}</Badge> }))} />
          ) : (
            <EmptyState compact icon={<Check className="size-5" aria-hidden="true" />} title="No card due today">The next cards come back on their day.</EmptyState>
          )}
        </Tile>
        <Tile title="Top patterns of your mistakes" note={course.patterns.length}>
          {course.patterns.length ? (
            <RecordList rows={course.patterns.map(p => ({ id: `${p.count}×`, main: p.pattern, sub: `last on ${p.last}` }))} />
          ) : (
            <EmptyState compact icon={<Check className="size-5" aria-hidden="true" />} title="No mistake logged yet">A study session logs each one in your own words.</EmptyState>
          )}
        </Tile>
      </div>
      <Tile title="Scores by criterion" note={course.trends.length}>
        <Scores trends={course.trends} />
      </Tile>
    </div>
  )
}

/** The courses of the desk: a card for each, with what is due today and how much is scored, as a link to its page. */
export function Courses({ courses, base }: { courses: CourseView[]; base: string }) {
  if (!courses.length) return <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title="No course yet">Type <CopyCommand text="/learn-setup" /> in the agent session to start one.</EmptyState>
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map(c => (
        <IconCard
          key={c.name}
          href={`${base}/learn/${c.name}`}
          icon={<GraduationCap aria-hidden="true" />}
          tone="violet"
          title={c.name}
          description={`${count(c.due.length, 'card')} due today · ${count(c.patterns.length, 'pattern')} of mistakes`}
          tags={[`${c.trends.length} scored ${c.trends.length === 1 ? 'criterion' : 'criteria'}`]}
        />
      ))}
    </div>
  )
}
