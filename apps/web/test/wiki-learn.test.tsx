import { describe, expect, test } from 'bun:test'

import type { CourseView } from '@nook/learn/read.ts'
import type { WikiView } from '@nook/wiki/read.ts'

import { Courses, CoursePage, trendChart } from '@/components/learn/course-page.tsx'
import { ShelfPage, WikiHome } from '@/components/wiki/wiki-home.tsx'
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
  test('lists the drafts that wait for a yes first, then a card for each shelf with its use, its count of pages and their types', () => {
    const markup = html(<WikiHome wiki={wiki} base="/personal" />)
    expect(markup).toContain('<a href="/personal/wiki/drafts/payment-retries.md" class="hover:underline">Payment retries</a>')
    expect(markup).toContain('<a data-slot="icon-card" href="/personal/wiki/resources"')
    expect(text(markup)).toBe(
      'Drafts that wait for your yes 1 Payment retries drafts/payment-retries.md draft ' +
        'Shelves 2 ideas 0 pages an idea that has not started resources 1 page system how a system works',
    )
  })

  test('a wiki with no shelf says how to make them', () => {
    expect(text(html(<WikiHome wiki={{ ...wiki, drafts: [], shelves: [] }} base="/personal" />))).toBe('Shelves 0 No shelf yet Run /setup in the agent session: it writes the shelves of the wiki into nook.yml.')
  })

  test('a shelf alone lists its pages with their summary and type', () => {
    const markup = html(<ShelfPage shelf={wiki.shelves[1]!} base="/personal" />)
    expect(markup).toContain('<a href="/personal/wiki/resources/shipments-api.md" class="hover:underline">Shipments api</a>')
    expect(markup).toMatch(/data-slot="badge" data-tone="primary" data-variant="label"[^>]*>system</)
  })

  test('says how to turn the wiki on in a desk with none', () => {
    expect(text(html(<WikiHome wiki={null} base="/personal" />))).toBe('This desk has no wiki Add wiki to the packs of nook.yml, then run /setup in the agent session.')
  })
})

describe('WikiPage', () => {
  test('renders the page with its blocks and each link, a broken one marked', () => {
    const page = { path: 'resources/shipments-api.md', text: '---\ntype: system\n---\n# Shipments api\n\nPages of 20, see [[shipments-page]].\n', links: [{ link: '[[shipments-page]]', target: 'resources/shipments-page.md' }, { link: 'old.md', target: null }] }
    const markup = html(<WikiPage page={page} base="/personal" />)
    expect(markup).toContain('<a href="/personal/wiki/resources/shipments-page.md" class="hover:underline">[[shipments-page]]</a>')
    expect(markup).toContain('<p>Pages of 20, see <a href="/personal/wiki/resources/shipments-page.md">shipments-page</a>.</p>')
    expect(text(markup)).toBe(
      'Shipments api docs/wiki/resources/shipments-api.md · type system Pages of 20, see shipments-page . ' +
        'Links 2 page [[shipments-page]] none old.md no such page',
    )
  })

  test('a draft says that it waits for the yes of the owner', () => {
    expect(text(html(<WikiPage page={{ path: 'drafts/payment-retries.md', text: '# Payment retries\n', links: [] }} base="/personal" />))).toContain('A draft It waits for your yes.')
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
      'English Cards due 1 c3 a decision ___ the plan on box 2 ' +
        'Top patterns of your mistakes 1 4× a missing article before a singular noun last on 2026-10-17 ' +
        'Scores by criterion 2 6.5 Task Achievement last on 2026-10-17, task 2 · 2 scores 7 Lexical Resource last on 2026-10-17, task 2 · 1 score',
    )
  })

  test('lists each course with what waits in it', () => {
    expect(text(html(<Courses courses={[course]} base="/personal" />))).toBe('english 2 scored criteria 1 card due today · 1 pattern of mistakes')
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
