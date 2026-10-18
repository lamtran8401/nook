import { describe, expect, test } from 'bun:test'

import type { HomeView } from '@nook/core/read.ts'

import { HomeBrief } from '../components/HomeBrief.tsx'
import { html, text } from './markup.ts'

const view = (fields: Partial<HomeView>): HomeView => ({ dir: '/desk', brief: [], findings: [], ...fields })

describe('HomeBrief', () => {
  test('shows what waits, the urgent wait first, then what is done and what runs', () => {
    const brief: HomeView['brief'] = [
      { part: 'runs', text: 'SHOP-14 cooking: 2 of 5 slices done' },
      { part: 'waits', text: 'SHOP-13 waits for your accept', action: '/gate accept SHOP-13' },
      { part: 'done', text: 'SHOP-11 done' },
      { part: 'waits', text: 'SHOP-12 has a blocking question', action: 'nook eng answer SHOP-12 Q1 "<answer>"', urgent: true },
    ]
    expect(text(html(<HomeBrief view={view({ brief })} />))).toBe(
      'Waits for you ! SHOP-12 has a blocking question nook eng answer SHOP-12 Q1 "<answer>" · SHOP-13 waits for your accept /gate accept SHOP-13 ' +
        'Done since yesterday ✓ SHOP-11 done Runs › SHOP-14 cooking: 2 of 5 slices done',
    )
  })

  test('says that nothing waits when no line waits', () => {
    expect(text(html(<HomeBrief view={view({ brief: [{ part: 'done', text: 'SHOP-11 done' }] })} />))).toBe('Nothing waits for you. Done since yesterday ✓ SHOP-11 done')
  })
})
