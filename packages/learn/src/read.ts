import type { Card } from './cards.ts'
import type { Pattern } from './course.ts'
import { dayOf, findLearn } from './learn.ts'

/** The read path of learn for the web app: for each course, the cards due, the top patterns, and the bands of each criterion over time. */

export type BandPoint = { date: string; band: string; task: string }
export type CriterionTrend = { criterion: string; points: BandPoint[] }
export type CourseView = { name: string; due: Card[]; patterns: Pattern[]; trends: CriterionTrend[] }

const TOP_PATTERNS = 5

export function readLearn(desk: string, today = dayOf()): CourseView[] {
  const learn = findLearn(desk)
  if (!learn) return []
  return learn.courses().map(course => {
    const trends = new Map<string, BandPoint[]>()
    for (const s of [...course.scores()].sort((a, b) => a.date.localeCompare(b.date)))
      trends.set(s.criterion, [...(trends.get(s.criterion) ?? []), { date: s.date, band: s.band, task: s.task }])
    return {
      name: course.name,
      due: course.deck.due(today),
      patterns: course.topPatterns(TOP_PATTERNS),
      trends: [...trends].map(([criterion, points]) => ({ criterion, points })),
    }
  })
}
