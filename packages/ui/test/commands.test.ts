import { describe, expect, test } from 'bun:test'

import { type Command, groupsOf, pressKey, visibleCommands } from '@nook/ui/lib/commands.ts'

const run = () => {}
const commands: Command[] = [
  { id: 'approve-SHOP-43', group: 'Your moves', label: 'Approve SHOP-43', sub: 'Export the order list as CSV', run },
  { id: 'item-SHOP-42', group: 'Items', label: 'SHOP-42 Pay for an order with a saved card', sub: 'cooking', run },
  { id: 'page-works', group: 'Go to', label: 'Board', sub: 'page', keys: ['g', 'b'], run },
  { id: 'page-wiki', group: 'Go to', label: 'Wiki', sub: 'page', keys: ['g', 'w'], run },
  { id: 'desk-company', group: 'Desks', label: 'company', sub: '7 open items', run },
]

describe('the commands of the menu', () => {
  test('with no words every command shows, in the groups of their first appearance', () => {
    expect(groupsOf(visibleCommands(commands, '')).map(([group, list]) => `${group}:${list.length}`)).toEqual(['Your moves:1', 'Items:1', 'Go to:2', 'Desks:1'])
  })

  test('the words keep the commands whose label or note holds them, in any case', () => {
    expect(visibleCommands(commands, 'appr').map(c => c.id)).toEqual(['approve-SHOP-43'])
    expect(visibleCommands(commands, 'COOKING').map(c => c.id)).toEqual(['item-SHOP-42'])
    expect(visibleCommands(commands, 'nothing like it')).toEqual([])
  })

  test('G waits for the next key, and G then B runs the command of the board', () => {
    const first = pressKey([], 'g', commands)
    expect(first).toEqual({ pending: ['g'] })
    expect(pressKey(first.pending, 'B', commands).command?.id).toBe('page-works')
  })

  test('a key that starts no sequence runs nothing and keeps nothing', () => {
    expect(pressKey([], 'x', commands)).toEqual({ pending: [] })
    expect(pressKey(['g'], 'x', commands)).toEqual({ pending: [] })
  })
})
