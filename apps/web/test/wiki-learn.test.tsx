import { describe, expect, test } from 'bun:test'

import type { CourseView } from '@nook/learn/read.ts'
import type { WikiView } from '@nook/wiki/read.ts'

import { Courses, CoursePage, trendChart } from '@/components/learn/course-page.tsx'
import { WikiHome } from '@/components/wiki/wiki-home.tsx'
import { WikiPage } from '@/components/wiki/wiki-page.tsx'
import { html, text } from '@/test/markup.ts'

const wiki: WikiView = {
  dir: '/desk/docs/wiki',
  drafts: ['payment-retries.md'],
  shelves: [
    { name: 'ideas', use: 'an idea that has not started', lines: [] },
    { name: 'resources', use: 'how a system works', lines: [{ page: 'shipments-api.md', type: 'system', summary: 'The api lists the shipments in pages of 20.' }] },
  ],
}

describe('WikiHome', () => {
  test('lists the drafts that wait for a yes first, then a group for each shelf with its pages and their type', () => {
    const markup = html(<WikiHome wiki={wiki} />)
    expect(markup).toContain('<a href="/wiki/drafts/payment-retries.md" class="hover:underline">Payment retries</a>')
    expect(markup).toContain('<a href="/wiki/resources/shipments-api.md" class="hover:underline">Shipments api</a>')
    expect(markup).toContain('<a href="/wiki/resources"')
    expect(markup).toMatch(/data-slot="badge" data-tone="primary" data-variant="label"[^>]*>system</)
    expect(text(markup)).toBe(
      'Drafts that wait for your yes 1 Payment retries drafts/payment-retries.md draft ' +
        'ideas 0 an idea that has not started No page yet. A page joins the shelf after your yes to its draft. ' +
        'resources 1 how a system works Shipments api The api lists the shipments in pages of 20. system',
    )
  })

  test('says how to turn the wiki on in a desk with none', () => {
    expect(text(html(<WikiHome wiki={null} />))).toBe('This desk has no wiki Add wiki to the packs of nook.yml, then run /setup in the agent session.')
  })
})

describe('WikiPage', () => {
  test('renders the page with its blocks and each link, a broken one marked', () => {
    const page = { path: 'resources/shipments-api.md', text: '---\ntype: system\n---\n# Shipments api\n\nPages of 20, see [[shipments-page]].\n', links: [{ link: '[[shipments-page]]', target: 'resources/shipments-page.md' }, { link: 'old.md', target: null }] }
    const markup = html(<WikiPage page={page} />)
    expect(markup).toContain('<a href="/wiki/resources/shipments-page.md" class="hover:underline">[[shipments-page]]</a>')
    expect(markup).toContain('<p>Pages of 20, see <a href="/wiki/resources/shipments-page.md">shipments-page</a>.</p>')
    expect(text(markup)).toBe(
      'Wiki resources shipments-api.md docs/wiki/resources/shipments-api.md · type system Shipments api Pages of 20, see shipments-page . ' +
        'Links page [[shipments-page]] none old.md no such page',
    )
  })

  test('a draft says that it waits for the yes of the owner', () => {
    expect(text(html(<WikiPage page={{ path: 'drafts/payment-retries.md', text: '# Payment retries\n', links: [] }} />))).toContain('A draft It waits for your yes.')
  })
})

const course: CourseView = {
  name: 'english',
  due: [{ id: 'c3', front: 'a decision ___ the plan', back: 'on', box: 2, due: '2026-10-18', last: '2026-10-16' }],
  patterns: [{ pattern: 'a missing article before a singular noun', count: 4, last: '2026-10-17' }],
  trends: [
    { criterion: 'Task Achievement', points: [{ date: '2026-10-10', band: '6', task: 'task 1' }, { date: '2026-10-17', band: '6.5', task: 'task 2' }] },
    { criterion: 'Lexical Resource', points: [{ date: '2026-10-17', band: '7', task: 'task 2' }] },
  ],
}

describe('CoursePage', () => {
  test('shows the cards due, the top patterns and the last band of each criterion', () => {
    expect(text(html(<CoursePage course={course} />))).toBe(
      'Learn english English Cards due · 1 c3 a decision ___ the plan on box 2 ' +
        'Top patterns of your mistakes 4× a missing article before a singular noun last on 2026-10-17 ' +
        'Scores by criterion 6.5 Task Achievement last on 2026-10-17, task 2 · 2 scores 7 Lexical Resource last on 2026-10-17, task 2 · 1 score',
    )
  })

  test('lists each course with what waits in it', () => {
    expect(text(html(<Courses courses={[course]} />))).toBe('Courses 1 english 1 card due · 1 pattern · 2 scored criteria')
  })
})

describe('trendChart', () => {
  test('draws a line for each criterion scored on every day, and leaves out one with a day missing', () => {
    expect(trendChart(course.trends)).toEqual({
      type: 'chart', kind: 'line', x: ['2026-10-10', '2026-10-17'], min: 5, max: 8, step: 0.5,
      series: [{ name: 'Task Achievement', values: [6, 6.5] }],
    })
  })

  test('draws no chart with fewer than two days of scores', () => {
    expect(trendChart([course.trends[1]!])).toBeNull()
  })
})
