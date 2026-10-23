import { describe, expect, test } from 'bun:test'

import { type CommandData, workspaceCommands, searchCommand } from '@/lib/commands.ts'

const data: CommandData = {
  base: '/personal',
  moves: [{ move: 'approve', item: 'SHOP-43', title: 'Export the order list as CSV' }],
  items: [{ id: 'SHOP-42', title: 'Pay for an order with a saved card', state: 'cooking' }],
  pages: [
    { label: 'Home', href: '/personal' },
    { label: 'Board', href: '/personal/works' },
    { label: 'Settings', href: '/personal/settings' },
  ],
  workspaces: [{ name: 'company', href: '/company', open: 7 }],
}

describe('the commands of a workspace', () => {
  test('the moves that wait come first, then the items, the pages and the workspaces', () => {
    const groups = [...new Set(workspaceCommands(data, true, { go() {}, move() {} }).map(c => c.group))]
    expect(groups).toEqual(['Your moves', 'Items', 'Go to', 'Workspaces'])
  })

  test('a move names the move and the item, and runs the move of the page, which asks first', () => {
    const asked: string[] = []
    const approve = workspaceCommands(data, true, { go() {}, move: (move, item) => asked.push(`${move} ${item}`) })[0]!
    expect([approve.label, approve.sub]).toEqual(['Approve SHOP-43', 'Export the order list as CSV'])
    approve.run()
    expect(asked).toEqual(['approve SHOP-43'])
  })

  test('a browser with no pair gets no move, since the gate refuses it', () => {
    expect(workspaceCommands(data, false, { go() {}, move() {} }).some(c => c.group === 'Your moves')).toBe(false)
  })

  test('each page takes G and its first letter, and goes to its page', () => {
    const went: string[] = []
    const pages = workspaceCommands(data, true, { go: href => went.push(href), move() {} }).filter(c => c.group === 'Go to')
    expect(pages.map(c => `${c.label}:${c.keys?.join('')}`)).toEqual(['Home:gh', 'Board:gb', 'Settings:gs'])
    pages[1]!.run()
    expect(went).toEqual(['/personal/works'])
  })

  test('an item goes to its page, and a workspace to its home', () => {
    const went: string[] = []
    const all = workspaceCommands(data, true, { go: href => went.push(href), move() {} })
    all.find(c => c.group === 'Items')!.run()
    all.find(c => c.group === 'Workspaces')!.run()
    expect(went).toEqual(['/personal/works/SHOP-42', '/company'])
  })

  test('typed words add a search of the workspace for them', () => {
    const went: string[] = []
    const search = searchCommand('/personal', 'saved card', href => went.push(href))
    expect(search.label).toBe('Search the workspace for “saved card”')
    search.run()
    expect(went).toEqual(['/personal/search?q=saved%20card'])
  })
})
