import { describe, expect, test } from 'bun:test'

import type { BriefLine, Finding } from '@nook/workspace/workspaces.ts'

import { type BriefFolder, collectBrief, formatBrief, startOfYesterday } from '../src/brief/brief.ts'

const SINCE = new Date('2026-10-15T00:00:00.000Z')

describe('collectBrief', () => {
  test('a gap of the doctor waits with its fix; the lines of the packs follow; an ok finding is no line', () => {
    const gaps: Record<string, Finding[]> = {
      '/a/personal': [
        { level: 'warn', where: 'wiki', text: 'resources/INDEX.md lacks a line', fix: 'nook wiki index --fix' },
        { level: 'ok', where: '/a/personal', text: '1 workspace, no gap' },
      ],
    }
    const packLines: Record<string, BriefLine[]> = {
      '/a/personal': [
        { part: 'waits', urgent: true, text: 'IT-7 waits for your accept', action: '/gate accept IT-7' },
        { part: 'done', text: 'IT-6 closed: readable dates' },
      ],
    }
    const folders = collectBrief(['/a/personal'], SINCE, { gaps: dir => gaps[dir] ?? [], lines: dir => packLines[dir] ?? [] })
    expect(folders).toEqual([
      {
        dir: '/a/personal',
        lines: [
          { part: 'waits', urgent: true, text: 'resources/INDEX.md lacks a line', action: 'nook wiki index --fix' },
          { part: 'waits', urgent: true, text: 'IT-7 waits for your accept', action: '/gate accept IT-7' },
          { part: 'done', text: 'IT-6 closed: readable dates' },
        ],
      },
    ])
  })

  test('a gap that two folders share shows once, under the first folder', () => {
    const gap: Finding = { level: 'error', where: 'core', text: 'the nook plugin is off', fix: 'claude plugin enable nook' }
    const folders = collectBrief(['/a/one', '/a/two'], SINCE, { gaps: () => [gap], lines: () => [] })
    expect(folders.map(f => f.lines.length)).toEqual([1, 0])
  })
})

describe('formatBrief', () => {
  const lines = (dir: string, list: BriefLine[]): BriefFolder => ({ dir, lines: list })

  test('one folder: the waits first, the urgent ones on top, then done and runs, each with its action', () => {
    const text = formatBrief([
      lines('/a/personal', [
        { part: 'runs', text: 'IT-8 cooking: T2 runs in web', action: '/cook IT-8' },
        { part: 'waits', text: 'a wiki draft waits for your yes: ideas/export.md', action: 'read it' },
        { part: 'waits', urgent: true, text: 'IT-7 waits for your accept', action: '/gate accept IT-7' },
        { part: 'done', text: 'IT-6 closed: readable dates' },
      ]),
    ])
    expect(text).toBe(
      [
        'Waits for you',
        '- IT-7 waits for your accept → /gate accept IT-7',
        '- a wiki draft waits for your yes: ideas/export.md → read it',
        '',
        'Done since yesterday',
        '- IT-6 closed: readable dates',
        '',
        'Runs',
        '- IT-8 cooking: T2 runs in web → /cook IT-8',
      ].join('\n'),
    )
  })

  test('more than one folder: each line names its folder', () => {
    const text = formatBrief([
      lines('/a/personal', [{ part: 'waits', urgent: true, text: 'IT-7 waits for your accept', action: '/gate accept IT-7' }]),
      lines('/a/company', [{ part: 'runs', text: 'SHOP-12 planning: filter', action: '/recipe SHOP-12' }]),
    ])
    expect(text).toBe(['Waits for you', '- personal: IT-7 waits for your accept → /gate accept IT-7', '', 'Runs', '- company: SHOP-12 planning: filter → /recipe SHOP-12'].join('\n'))
  })

  test('a quiet day says that nothing waits, then what is done', () => {
    expect(formatBrief([lines('/a/personal', [{ part: 'done', text: 'IT-6 closed' }])])).toBe(['Nothing waits for you.', '', 'Done since yesterday', '- IT-6 closed'].join('\n'))
    expect(formatBrief([lines('/a/personal', [])])).toBe('Nothing waits for you.')
  })
})

describe('startOfYesterday', () => {
  test('is the midnight before the day before', () => {
    const since = startOfYesterday(new Date(2026, 9, 17, 9, 30))
    expect([since.getFullYear(), since.getMonth(), since.getDate(), since.getHours(), since.getMinutes()]).toEqual([2026, 9, 16, 0, 0])
  })
})
