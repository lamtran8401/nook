import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { readBoard } from '@nook/engineering/read/reader.ts'

import { desk, evaluate, open, press, resize, startBrowser, stopBrowser, typeText, until } from './browser.ts'

beforeAll(startBrowser, 400_000)
afterAll(stopBrowser)

describe('the shell of the web app in a real browser', () => {
  test('[ hides the docked sidebar, and [ again docks it', async () => {
    await open('/shop')
    expect(await evaluate(`document.querySelector('[data-slot=app-shell]').dataset.side`)).toBe('docked')
    await press('[', 'BracketLeft')
    await until(`document.querySelector('[data-slot=app-shell]').dataset.side === 'hidden'`)
    await press('[', 'BracketLeft')
    await until(`document.querySelector('[data-slot=app-shell]').dataset.side === 'docked'`)
  }, 60_000)

  test('⌘K opens the menu with the moves that wait first, and Escape closes it', async () => {
    await open('/shop')
    await press('k', 'KeyK', 2)
    await until(`!!document.querySelector('[data-slot=command-menu]')`)
    expect(await evaluate(`document.querySelector('[data-slot=command-menu] p').textContent`)).toBe('Your moves')
    await press('Escape', 'Escape')
    await until(`!document.querySelector('[data-slot=command-menu]')`)
  }, 60_000)

  test('G then B opens the board', async () => {
    await open('/shop')
    await press('g', 'KeyG')
    await press('b', 'KeyB')
    await until(`location.pathname === '/shop/works'`)
  }, 60_000)

  test('Approve from ⌘K asks first, and Cancel runs nothing', async () => {
    await open('/shop')
    await press('k', 'KeyK', 2)
    await until(`!!document.querySelector('[data-slot=command-menu] input')`)
    await typeText('Approve SHOP-43')
    await press('Enter', 'Enter')
    await until(`[...document.querySelectorAll('[role=alertdialog] h2')].some(h => h.textContent === 'Approve SHOP-43?')`)
    await evaluate(`[...document.querySelectorAll('[role=alertdialog] button')].find(b => b.textContent === 'Cancel').click()`)
    await until(`!document.querySelector('[role=alertdialog]')`)
    expect(readBoard(desk).find(card => card.id === 'SHOP-43')?.state).toBe('planning')
  }, 60_000)

  test('a page of 390 px floats the sidebar and runs no line off the page', async () => {
    await resize({ width: 390, height: 844 })
    await open('/shop/works')
    expect(await evaluate(`document.querySelector('[data-slot=app-shell]').dataset.side`)).toBe('hidden')
    expect(await evaluate(`document.documentElement.scrollWidth <= innerWidth`)).toBe(true)
    await resize()
  }, 60_000)
})
