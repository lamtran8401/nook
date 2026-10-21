import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { evaluate, open, press, startBrowser, stopBrowser, until } from './browser.ts'

beforeAll(startBrowser, 400_000)
afterAll(stopBrowser)

const frameText = (n: number) => evaluate(`document.querySelectorAll('[data-slot=frame]')[${n}].innerText.replace(/\\s+/g, ' ')`)

/** Opens the Display menu from the keys, as Radix opens it, and follows its link named `name`. */
async function pick(name: string) {
  await evaluate(`[...document.querySelectorAll('[aria-haspopup=menu]')].find(button => button.innerText.includes('Display')).focus()`)
  await press('Enter', 'Enter')
  await until(`!!document.querySelector('[role=menu]')`)
  const before = await evaluate('location.href')
  await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(item => item.innerText.startsWith(${JSON.stringify(name)})).click()`)
  await until(`location.href !== ${JSON.stringify(before)} && document.readyState === 'complete' && !!document.querySelector('[data-slot=app-shell]')`)
}

describe('the board in a real browser', () => {
  test('at 1440 px the four phases stand in one row, and nothing scrolls sideways', async () => {
    await open('/shop/works')
    const tops = await evaluate(`[...document.querySelectorAll('[data-slot=frame]')].slice(0, 4).map(frame => frame.getBoundingClientRect().top)`)
    expect(new Set(tops).size).toBe(1)
    expect(await evaluate(`document.documentElement.scrollWidth <= innerWidth`)).toBe(true)
  }, 60_000)

  test('an item of 8 points shows 8 pt, and its phase counts it', async () => {
    await open('/shop/works')
    expect(await evaluate(`document.querySelector('a[href="/shop/works/SHOP-42"]').innerText.replace(/\\s+/g, ' ')`)).toContain('8 pt')
    expect(await frameText(1)).toStartWith('Build 1 8 pt')
  }, 60_000)

  test('a kind with no item in a phase says so in that phase', async () => {
    await open('/shop/works?kind=fix')
    expect(await frameText(3)).toContain('No fix items in Done')
  }, 60_000)

  test('List and Who holds it from the Display menu show one group for each holder', async () => {
    await open('/shop/works')
    await pick('List')
    await pick('Who holds it')
    expect(await evaluate('location.search')).toBe('?layout=list&group=holder')
    expect(await evaluate(`[...document.querySelectorAll('[data-slot=item-group] > summary')].map(s => s.innerText.split('\\n')[0])`)).toEqual(['Waits for you', 'The lead runs', 'Backlog', 'Done'])
  }, 60_000)

  test('a click on a row of the list opens it in place with the next move and two links', async () => {
    await open('/shop/works?layout=list')
    await evaluate(`document.querySelector('[data-slot=item-row] > summary').click()`)
    expect(await evaluate(`document.querySelector('[data-slot=item-row]').open`)).toBe(true)
    expect(await evaluate(`[...document.querySelectorAll('[data-slot=item-row][open] a')].map(a => a.innerText)`)).toEqual(['Open the item', 'Read the spec'])
  }, 60_000)
})
