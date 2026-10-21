import { describe, expect, test } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { FlowLane } from '@nook/ui/components/flow-lane.tsx'
import { Frame } from '@nook/ui/components/frame.tsx'
import { ItemCard } from '@nook/ui/components/item-card.tsx'
import { ItemGroup, ItemRow } from '@nook/ui/components/item-list.tsx'
import { StepBar } from '@nook/ui/components/step-bar.tsx'

const html = (element: ReactElement) => renderToStaticMarkup(element)
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const states = (markup: string) => [...markup.matchAll(/data-step="(\w+)"/g)].map(m => m[1])

describe('the parts of the board', () => {
  test('a step bar marks the steps before the current one done and the current one now', () => {
    expect(states(html(<StepBar count={7} at={4} />))).toEqual(['done', 'done', 'done', 'done', 'now', 'todo', 'todo'])
  })

  test('a step bar of a finished item marks every step done', () => {
    expect(states(html(<StepBar count={7} at={6} finished />))).toEqual(['done', 'done', 'done', 'done', 'done', 'done', 'done'])
  })

  test('the lane shows each phase with its count, its points and the items that wait for the owner', () => {
    const lane = html(<FlowLane parts={[{ name: 'Shape', tone: 'violet', count: 2, points: 10, waits: 1 }, { name: 'Done', tone: 'success', count: 0, points: 0, waits: 0 }]} />)
    expect(text(lane)).toBe('Shape 2 10 pt 1 Done 0 0 pt')
    expect(lane).toContain('title="1 wait for you"')
  })

  test('a frame has its title, its count and its points, and says what is empty when it holds nothing', () => {
    expect(text(html(<Frame title="Review" count={0} points={0} empty="No fix items in Review" />))).toBe('Review 0 0 pt No fix items in Review')
    expect(text(html(<Frame title="Backlog" count={1} about="Not started."><p>SHOP-46</p></Frame>))).toBe('Backlog 1 Not started. SHOP-46')
  })

  test('an item card links to its item and shows its id, its points, its areas and its title; a card that waits for the owner is marked', () => {
    const card = html(<ItemCard href="/shop/works/SHOP-42" kind={<i />} id="SHOP-42" points={8} areas={['api', 'web']} title="Pay for an order with a saved card" steps={<StepBar count={7} at={4} />} needs />)
    expect(card).toStartWith('<a data-slot="item-card" href="/shop/works/SHOP-42"')
    expect(card).toContain('data-needs="true"')
    expect(text(card)).toBe('SHOP-42 8 pt api · web Pay for an order with a saved card')
  })

  test('a group of the list starts open and a row starts shut, with its next move after the first line', () => {
    const markup = html(
      <ItemGroup title="Build" tone="primary" count={1} points={8}>
        <ItemRow kind="F" id="SHOP-42" title="Pay with a saved card" marks="8 pt">
          Next: answer Q2
        </ItemRow>
      </ItemGroup>,
    )
    expect(markup).toStartWith('<details open="" data-slot="item-group"')
    expect(markup).toContain('<details data-slot="item-row" data-needs="false"')
    expect(text(markup)).toBe('Build 1 8 pt F SHOP-42 Pay with a saved card 8 pt Next: answer Q2')
  })
})
