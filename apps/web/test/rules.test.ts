import { describe, expect, test } from 'bun:test'

import { type Block, parseDoc, plainText } from '@/lib/blocks.ts'

const blocks = (md: string) => parseDoc(md).blocks
const find = <K extends Block['kind']>(list: Block[], kind: K) => list.find(b => b.kind === kind) as Extract<Block, { kind: K }>

describe('the heading rules', () => {
  test('a line under Acceptance criteria is a criterion with its number, its kind and its sources', () => {
    const list = find(blocks('## Acceptance criteria\n\n- [ADD] A person pays in one click. (ticket AC1, Q2)\n- [CHANGE] A decline shows the reason.\n'), 'criteria')
    expect(list.items.map(i => [i.n, i.tag, plainText(i.content), i.refs])).toEqual([
      [1, 'ADD', 'A person pays in one click.', ['ticket AC1', 'Q2']],
      [2, 'CHANGE', 'A decline shows the reason.', []],
    ])
  })

  test('a line under Details is a rule with its label, its words and its sources, a guess with its impact', () => {
    const list = find(blocks('## Details\n\n- **CVC:** not asked below 200 EUR. (Q2)\n- **Retries:** after 1, 5 and 30 minutes. (G5, high)\n- **Export:** waits for Q3. (open)\n'), 'rules')
    expect(list.items.map(i => [i.label, plainText(i.content), i.sources])).toEqual([
      ['CVC', 'not asked below 200 EUR.', [{ text: 'Q2' }]],
      ['Retries', 'after 1, 5 and 30 minutes.', [{ text: 'G5', level: 'high' }]],
      ['Export', 'waits for Q3.', [{ text: 'open' }]],
    ])
  })

  test('a line under What works now is a piece with its title, and slice ids after the title are dropped', () => {
    const list = find(blocks('## What works now\n\n- **Charge a saved card:** the page sends a card id.\n- **Keep the cards** (T1, T4): a card saves on a tick.\n'), 'pieces')
    expect(list.items.map(i => [i.title, plainText(i.content)])).toEqual([
      ['Charge a saved card', 'the page sends a card id.'],
      ['Keep the cards', 'a card saves on a tick.'],
    ])
  })

  test('a line under What changes is a card of its area, with the words after the area', () => {
    const list = find(blocks('## What changes\n\n- **api:** keeps a token for each card.\n- **web:** shows the saved cards.\n'), 'pieces')
    expect(list.items.map(i => [i.title, plainText(i.content)])).toEqual([['api', 'keeps a token for each card.'], ['web', 'shows the saved cards.']])
  })

  test('a question of the findings with its Answer, Evidence and Open lines becomes a card, answered when it has an answer and evidence', () => {
    const list = blocks('## Q1: Where does the time go?\n\n- Answer: the database.\n- Evidence: EXPLAIN on the copy.\n- Open: the index build time.\n\n## Q2\n\n- Answer: \n- Evidence: \n')
    const cards = list.filter(b => b.kind === 'finding') as Extract<Block, { kind: 'finding' }>[]
    expect(cards.map(c => [c.id, c.title, c.answered, c.rows.map(([label, value]) => `${label}: ${plainText(value)}`)])).toEqual([
      ['Q1', 'Where does the time go?', true, ['Answer: the database.', 'Evidence: EXPLAIN on the copy.', 'Open: the index build time.']],
      ['Q2', '', false, ['Answer: ', 'Evidence: ']],
    ])
  })

  test('a step under Try it splits into what to do and what you see', () => {
    const list = find(blocks('## Try it\n\n1. Run `bun test` in api. Every test passes.\n2. Open the page.\n'), 'steps')
    expect(list.items.map(i => [plainText(i.action), plainText(i.seen)])).toEqual([
      ['Run bun test in api.', 'Every test passes.'],
      ['Open the page.', ''],
    ])
  })

  test('Out of scope, Heads up and Requirements met get their own lists', () => {
    const list = blocks('## Out of scope\n\n- Wallets.\n\n## Heads up\n\n- A code that the map does not know.\n\n## Requirements met\n\n- A person can save a card.\n')
    expect(list.map(b => b.kind)).toEqual(['heading', 'outlist', 'heading', 'headsup', 'heading', 'met'])
  })

  test('only the first list under a heading follows its rule', () => {
    expect(blocks('## Out of scope\n\n- Wallets.\n\nMore words.\n\n- a plain list\n').map(b => b.kind)).toEqual(['heading', 'outlist', 'paragraph', 'list'])
  })

  test('In short and Need to know quotes become callouts', () => {
    expect(blocks('> In short: the api charges a saved card.\n\n> Need to know: the key lives in payment_try.\n')).toMatchObject([
      { kind: 'callout', tone: 'short' },
      { kind: 'callout', tone: 'know' },
    ])
    expect(plainText(find(blocks('> In short: the api charges a saved card.\n'), 'callout').content)).toBe('The api charges a saved card.')
  })

  test('None: with a list of kinds becomes the chips of no impact', () => {
    expect(blocks('None: Cache, Consistency.\n')).toEqual([{ kind: 'none', kinds: ['Cache', 'Consistency'] }])
  })

  test('a slice heading with its key and value lines becomes a task card', () => {
    const list = blocks('## T1: Add the card tables\n\n- area: api\n- depends: none\n- acs: 2, 6\n- size: S\n- done when: the migration adds the tables\n')
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ kind: 'task', id: 'T1', title: 'Add the card tables', area: 'api', depends: 'none', size: 'S' })
    const task = list[0] as Extract<Block, { kind: 'task' }>
    expect(task.rows.map(([key, value]) => [key, plainText(value)])).toEqual([['Criteria', '2, 6'], ['Done when', 'the migration adds the tables']])
  })
})
