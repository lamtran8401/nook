import { describe, expect, test } from 'bun:test'

import type { Metrics } from '@nook/engineering/report/metrics.ts'

import { AgentsPage } from '@/components/desk/agents-page.tsx'
import { EventsPage } from '@/components/desk/events-page.tsx'
import { MetricsPage } from '@/components/desk/metrics-page.tsx'
import { SettingsPage } from '@/components/desk/settings-page.tsx'
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

describe('MetricsPage', () => {
  test('shows the six numbers of the flow, the root causes as bars of their share, and the guard blocks', () => {
    const markup = html(<MetricsPage metrics={METRICS} blocks={[{ hook: 'eng bash', reason: 'may not run `date`.', count: 2, at: '2026-10-19T09:00:00Z' }]} />)
    expect(text(markup)).toBe(
      'Flow Rework rate 25% 1 of 4 sent back First pass 67% 2 of 3 accepted Slice rework 10% 1 of 10 reopened ' +
        'Cycle time 25 h longest 48 h (SHOP-1) Approve wait 2 h longest 3 h (SHOP-1) Accept wait 6 h longest 18 h (SHOP-1) ' +
        'Root causes 2 Integration error 2 Requirement problem 1 Guard blocks 1 eng bash: may not run `date`. 2',
    )
    expect([...markup.matchAll(/width:(\d+)%/g)].map(m => m[1])).toEqual(['100', '50', '100'])
  })

  test('a desk with no engineering says where the metrics come from', () => {
    expect(text(html(<MetricsPage metrics={null} blocks={[]} />))).toBe('This desk has no engineering The metrics come from the ledger of the engineering pack.')
  })
})

describe('AgentsPage', () => {
  test('a card for each agent and each skill, with its job and its pack, in the color of its pack', () => {
    const markup = html(<AgentsPage parts={[{ kind: 'agent', pack: 'engineering', name: 'scout', job: 'Reads code.' }, { kind: 'skill', pack: 'core', name: 'setup', job: 'Sets up a desk.' }]} />)
    expect(text(markup)).toBe('Agents 1 scout Reads code. engineering Skills 1 setup Sets up a desk. core')
    expect([...markup.matchAll(/data-slot="icon-tile" data-tone="(\w+)"/g)].map(m => m[1])).toEqual(['primary', 'ink'])
  })
})

describe('EventsPage', () => {
  const EVENTS = [
    { kind: 'block' as const, at: '2026-10-20T09:05:00Z', hook: 'eng bash', agent: 'nk-eng:reviewer', reason: 'may not run `date`.', command: 'date' },
    { kind: 'prompt' as const, at: '2026-10-20T09:00:00Z', text: 'merge' },
  ]

  test('lists the events in the order given, each with its time, its kind and its words, under the filter by kind', () => {
    const markup = html(<EventsPage events={EVENTS} base="/personal" />)
    expect(text(markup)).toMatch(/^All Prompts Blocks Errors \d+ Oct \d\d:05 block eng bash \(nk-eng:reviewer\): may not run `date`\. date \d+ Oct \d\d:00 prompt merge$/)
    expect(markup).toContain('href="/personal/events" aria-current="page"')
  })

  test('the filter marks the open kind, and an empty log says what lands in it', () => {
    const markup = html(<EventsPage events={[]} kind="error" base="/personal" />)
    expect(markup).toContain('href="/personal/events?kind=error" aria-current="page"')
    expect(text(markup)).toBe('All Prompts Blocks Errors No event here yet Each block of a guard, each error of a hook and each prompt lands in the log of the desk.')
  })
})

describe('SettingsPage', () => {
  test('shows the packs, the areas with their checks, the kinds learned, the root cause types and the file', () => {
    const settings = {
      packs: ['core', 'engineering'],
      file: '/d/nook.yml',
      engineering: { areas: [{ name: 'api', path: 'projects/api', kind: 'backend', checks: ['bun test'] }], kinds: [{ type: 'Sub-Bug', kind: 'fix' as const }], rootCauses: ['Integration error', 'Unknown'], unknownRootCause: 'Unknown' },
    }
    expect(text(html(<SettingsPage settings={settings} />))).toBe('Packs 2 core engineering Areas 1 Area Path Kind Checks api projects/api backend bun test Kinds learned 1 Sub-Bug → fix Root causes 2 Integration error Unknown File /d/nook.yml')
  })

  test('a desk with no engineering shows its packs and its file only', () => {
    expect(text(html(<SettingsPage settings={{ packs: ['core'], file: '/d/nook.yml', engineering: null }} />))).toBe('Packs 1 core File /d/nook.yml')
  })
})
