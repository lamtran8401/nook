import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { readBoard } from '@nook/engineering/read/reader.ts'

import { desk, evaluate, open, press, startBrowser, stopBrowser, until } from './browser.ts'

beforeAll(startBrowser, 400_000)
afterAll(stopBrowser)

const picked = `[...document.querySelectorAll('[data-slot=inbox-row]')].map(row => row.dataset.selected)`

describe('the inbox in a real browser', () => {
  test('J picks a row, and A on a gate row asks first; Cancel runs nothing', async () => {
    await open('/shop')
    expect(await evaluate(picked)).not.toContain('true')
    const pickedRow = `document.querySelector('[data-slot=inbox-row][data-selected=true]')`
    await press('j', 'KeyJ')
    await until(`document.querySelector('[data-slot=inbox-row]').dataset.selected === 'true'`)
    // J again until the picked row holds a gate, so A has a move to run
    for (let i = 0; i < 5 && !(await evaluate(`!!${pickedRow}?.querySelector('[data-key=a]')`)); i++) await press('j', 'KeyJ')
    await press('a', 'KeyA')
    await until(`[...document.querySelectorAll('[role=alertdialog] h2')].some(h => h.textContent === 'Approve SHOP-43?')`)
    await evaluate(`[...document.querySelectorAll('[role=alertdialog] button')].find(b => b.textContent === 'Cancel').click()`)
    await until(`!document.querySelector('[role=alertdialog]')`)
    expect(readBoard(desk).find(card => card.id === 'SHOP-43')?.state).toBe('planning')
  }, 60_000)

  test('a click picks a row, and R puts the cursor in its answer box', async () => {
    await open('/shop')
    const row = `[...document.querySelectorAll('[data-slot=inbox-row]')].find(row => row.querySelector('input[name=answer]'))`
    await evaluate(`${row}.click()`)
    await until(`${row}.dataset.selected === 'true'`)
    await press('r', 'KeyR')
    await until(`document.activeElement?.name === 'answer'`)
  }, 60_000)
})
