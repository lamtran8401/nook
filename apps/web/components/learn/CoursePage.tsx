import type { CourseView, CriterionTrend } from '@nook/learn/read.ts'

import { Diagram } from '../Diagram.tsx'
import { EmptyState } from '../EmptyState.tsx'
import { Records } from '../Records.tsx'

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
  if (!trends.length) return <EmptyState compact icon="check" title="No score yet">The coach scores an answer in /learn-practice.</EmptyState>
  const chart = trendChart(trends)
  return (
    <>
      <Records
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
export function CoursePage({ course }: { course: CourseView }) {
  return (
    <div className="nk-item">
      <header className="nk-head">
        <ol className="bn-breadcrumb">
          <li><a href="/learn">Learn</a></li>
          <li><span aria-current="page">{course.name}</span></li>
        </ol>
        <h1 className="nk-head__title">{course.name.charAt(0).toUpperCase() + course.name.slice(1)}</h1>
      </header>
      <section className="nk-sec">
        <h2 className="nk-h2">Cards due · {course.due.length}</h2>
        {course.due.length ? (
          <Records rows={course.due.map(card => ({ id: card.id, main: card.front, sub: card.back, end: <span className="bn-badge" data-variant="plain">box {card.box}</span> }))} />
        ) : (
          <EmptyState compact icon="check" title="No card due today">The next cards come back on their day.</EmptyState>
        )}
      </section>
      <section className="nk-sec">
        <h2 className="nk-h2">Top patterns of your mistakes</h2>
        {course.patterns.length ? (
          <Records rows={course.patterns.map(p => ({ id: `${p.count}×`, main: p.pattern, sub: `last on ${p.last}` }))} />
        ) : (
          <EmptyState compact icon="check" title="No mistake logged yet">A study session logs each one in your own words.</EmptyState>
        )}
      </section>
      <section className="nk-sec">
        <h2 className="nk-h2">Scores by criterion</h2>
        <Scores trends={course.trends} />
      </section>
    </div>
  )
}

/** The courses of the desk, each a link to its page. */
export function Courses({ courses }: { courses: CourseView[] }) {
  if (!courses.length) return <EmptyState icon="file" title="No course yet">Type /learn-setup in the agent session to start one.</EmptyState>
  return (
    <section className="nk-sec">
      <h2 className="nk-h2">Courses</h2>
      <Records rows={courses.map(c => ({ id: String(c.due.length), main: <a href={`/learn/${c.name}`}>{c.name}</a>, sub: `${count(c.due.length, 'card')} due · ${count(c.patterns.length, 'pattern')} · ${c.trends.length} scored ${c.trends.length === 1 ? 'criterion' : 'criteria'}` }))} />
    </section>
  )
}
