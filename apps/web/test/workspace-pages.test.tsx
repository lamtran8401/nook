import { describe, expect, test } from 'bun:test'

import type { Metrics } from '@nook/engineering/report/metrics.ts'

import { AgentsPage } from '@/components/workspace/agents-page.tsx'
import { EventsPage } from '@/components/workspace/events-page.tsx'
import { MetricsPage } from '@/components/workspace/metrics-page.tsx'
import { SettingsPage } from '@/components/workspace/settings-page.tsx'
import { html, text } from '@/test/markup.ts'

const H = 3_600_000
const METRICS: Metrics = {
  since: '2026-09-20T00:00:00.000Z', until: '2026-10-20T00:00:00.000Z',
  rework: { part: 1, whole: 4, rejects: 2 }, firstPass: { part: 2, whole: 3 }, sliceRework: { part: 1, whole: 10 },
  cycle: { median: 25 * H, longest: { ms: 48 * H, item: 'SHOP-1' }, count: 3 },
  approveWait: { median: 2 * H, longest: { ms: 3 * H, item: 'SHOP-1' }, count: 2 },
  acceptWait: { median: 6 * H, longest: { ms: 18 * H, item: 'SHOP-1' }, count: 3 },
  rootCauses: [
    { type: 'Integration error', count: 2, items: ['SHOP-1', 'SHOP-3'], at: '2026-10-06T18:00:00.000Z' },
    { type: 'Requirement problem', count: 1, items: ['SHOP-2'], at: '2026-10-05T10:00:00.000Z' },
  ],
}

const WEEK = (accepts: number): Metrics => ({ ...METRICS, until: '2026-10-20T00:00:00.000Z', firstPass: { part: accepts, whole: accepts } })
const tiles = (markup: string) => [...markup.matchAll(/<section data-slot="(?:tile|trend-tile)"[\s\S]*?<\/section>/g)].map(m => text(m[0]))

describe('MetricsPage', () => {
  const BLOCKS = [{ hook: 'eng bash', reason: 'may not run `date`.', count: 2, at: '2026-10-19T09:00:00Z' }]

  test('shows the six numbers of the flow, each with its trend and its line', () => {
    const markup = html(<MetricsPage metrics={METRICS} trend={[WEEK(1), WEEK(2)]} blocks={BLOCKS} />)
    expect(tiles(markup).slice(0, 6)).toEqual([
      'Rework rate 25 % 1 of 4 sent back',
      'First pass 67 % 2 of 3 accepted',
      'Slice rework 10 % 1 of 10 reopened',
      'Cycle time 1 d 1 h median, longest 2 d (SHOP-1)',
      'Approve wait 2 h your gate, median',
      'Accept wait 6 h your accept, median',
    ])
    expect(markup.match(/data-slot="sparkline"/g)).toHaveLength(6)
  })

  test('the items done each week, the root causes and the guard blocks are bars of their share', () => {
    const markup = html(<MetricsPage metrics={METRICS} trend={[WEEK(1), WEEK(2)]} blocks={BLOCKS} />)
    expect(tiles(markup).slice(6)).toEqual([
      'Items done by week accepts week to 20 Oct 1 week to 20 Oct 2',
      'Root causes of fixes 2 Integration error 2 Requirement problem 1',
      'Guard blocks 1 eng bash: may not run `date`. 2',
    ])
    expect([...markup.matchAll(/width:(\d+)%/g)].map(m => m[1])).toEqual(['50', '100', '100', '50', '100'])
  })

  test('a workspace with no engineering says where the metrics come from', () => {
    expect(text(html(<MetricsPage metrics={null} trend={[]} blocks={[]} />))).toBe('This workspace has no engineering The metrics come from the ledger of the engineering pack.')
  })
})

describe('AgentsPage', () => {
  const PARTS = [{ kind: 'agent' as const, name: 'scout', job: 'Reads code.' }, { kind: 'skill' as const, name: 'setup', job: 'Sets up a workspace.' }]

  test('a small card for each agent and each skill with its job, agents in blue and skills in ink', () => {
    const markup = html(<AgentsPage parts={PARTS} />)
    expect(text(markup)).toBe('Agents scout Reads code. Skills /setup Sets up a workspace.')
    expect([...markup.matchAll(/data-slot="icon-tile" data-tone="(\w+)"/g)].map(m => m[1])).toEqual(['primary', 'ink'])
  })
})

describe('EventsPage', () => {
  const NOW = new Date('2026-10-20T12:00:00Z')
  const EVENTS = [
    { kind: 'block' as const, at: '2026-10-20T09:05:00Z', hook: 'eng bash', agent: 'nook:reviewer', reason: 'may not run `date`.', command: 'date' },
    { kind: 'prompt' as const, at: '2026-10-19T09:00:00Z', text: 'merge' },
  ]

  test('lists the events by day, newest first, each with its time, its kind, its source and its words', () => {
    const markup = html(<EventsPage events={EVENTS} base="/personal" now={NOW} />)
    expect(text(markup)).toMatch(/^all block error prompt one file a day in \.nook\/events\/ Today \d\d:05 block eng bash may not run `date`\. \(nook:reviewer\) date Yesterday \d\d:00 prompt prompt merge$/)
    expect(markup).toContain('href="/personal/events" data-active="" aria-current="page"')
  })

  test('the filter marks the open kind, and an empty log says what lands in it', () => {
    const markup = html(<EventsPage events={[]} kind="error" base="/personal" now={NOW} />)
    expect(markup).toContain('href="/personal/events?kind=error" data-active="" aria-current="page"')
    expect(text(markup)).toBe('all block error prompt one file a day in .nook/events/ No event here yet Each block of a guard, each error of a hook and each prompt lands in the log of the workspace.')
  })
})

describe('SettingsPage', () => {
  test('shows the features, the areas with their checks, the kinds learned, the root cause types and the file, each on its row', () => {
    const settings = {
      features: ['core', 'engineering'],
      file: '/d/nook.yml',
      engineering: { areas: [{ name: 'api', path: 'projects/api', kind: 'backend', checks: ['bun test'] }], kinds: [{ type: 'Sub-Bug', kind: 'fix' as const }], rootCauses: ['Integration error', 'Unknown'], unknownRootCause: 'Unknown' },
    }
    expect(text(html(<SettingsPage settings={settings} />))).toBe(
      'Features On where nook.yml has their section. core on engineering on Areas Where builders work. Area Folder Kind Checks api projects/api backend bun test ' +
        'Learned kinds Learned from your answers, with no setup. Ticket type Kind Sub-Bug fix Root cause types A fix names one at submit. Integration error Unknown ' +
        'File Edit it to change a feature or an area. /d/nook.yml',
    )
  })

  test('a workspace with no engineering shows its features and its file only', () => {
    expect(text(html(<SettingsPage settings={{ features: ['core'], file: '/d/nook.yml', engineering: null }} />))).toBe('Features On where nook.yml has their section. core on File Edit it to change a feature or an area. /d/nook.yml')
  })
})
