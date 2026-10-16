import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { WikiConfig } from '../src/config.ts'
import { parseIndex } from '../src/index-file.ts'
import { Wiki } from '../src/wiki.ts'

let root: string
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'kit-wiki-')))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
const read = (path: string) => readFileSync(join(root, path), 'utf8')

const SECTION = {
  shelves: [
    { name: 'ideas', use: 'An idea that has not started.' },
    { name: 'resources', use: 'Knowledge to look up.' },
    { name: 'daily', use: 'One note for each day.', index: false },
  ],
}

const IDEAS_INDEX = `# Ideas

One page for each idea, written by the owner.

| Page | Type | Summary |
|---|---|---|
| [a.md](a.md) | concept | The first idea, in the owner's words. |
| [b.md](b.md) | idea | A page that is gone. |
`

describe('WikiConfig', () => {
  test('with no wiki section, the defaults hold and the section is missing', () => {
    const config = WikiConfig.from(undefined)
    expect([config.dir, config.references, config.shelves, config.missing]).toEqual(['docs/wiki', 'docs/references', [], true])
  })

  test('reads the folders and each shelf with its use, and a shelf with no index', () => {
    const config = WikiConfig.from({ dir: 'notes', ...SECTION })
    expect(config.dir).toBe('notes')
    expect(config.shelves.map(s => [s.name, s.index])).toEqual([['ideas', true], ['resources', true], ['daily', false]])
    expect(config.archive).toBe('archive/wiki')
  })

  test('a shelf with no name is refused with its fix', () => {
    expect(() => WikiConfig.from({ shelves: [{ use: 'x' }] })).toThrow('kit.yml: each shelf of wiki needs a name')
  })
})

describe('parseIndex', () => {
  test('reads each row after the header as a page, its type and its summary', () => {
    expect(parseIndex(IDEAS_INDEX)).toEqual([
      { page: 'a.md', type: 'concept', summary: "The first idea, in the owner's words." },
      { page: 'b.md', type: 'idea', summary: 'A page that is gone.' },
    ])
  })
})

describe('Wiki.check', () => {
  test('names each page with no line, each line with no page, and a missing top index; a shelf with no index has no gap', () => {
    write('docs/wiki/ideas/INDEX.md', IDEAS_INDEX)
    write('docs/wiki/ideas/a.md', '# A\n')
    write('docs/wiki/ideas/c.md', '# C\n')
    write('docs/wiki/daily/2026-10-16.md', 'a day\n')
    mkdirSync(join(root, 'docs/wiki/resources'), { recursive: true })
    const gaps = new Wiki(root, WikiConfig.from(SECTION)).check()
    expect(gaps.map(g => g.text)).toEqual([
      'docs/wiki/INDEX.md is missing',
      'ideas/c.md has no line in ideas/INDEX.md',
      'ideas/INDEX.md names b.md, which does not exist',
      'resources/INDEX.md is missing',
    ])
    expect(gaps.map(g => g.fix)).toEqual([
      'kit wiki index --fix',
      'kit wiki index --fix',
      'restore the page, or remove the line',
      'kit wiki index --fix',
    ])
  })
})

describe('Wiki.fix', () => {
  test('adds a line for a page with no line, from its type and its In short line, and keeps every line of the owner', () => {
    write('docs/wiki/ideas/INDEX.md', IDEAS_INDEX)
    write('docs/wiki/ideas/a.md', '# A\n')
    write('docs/wiki/ideas/c.md', '---\ntype: plan\n---\n# C\n\n> In short: a channel on AI tools. It starts in May.\n')
    const made = new Wiki(root, WikiConfig.from(SECTION)).fix()
    expect(read('docs/wiki/ideas/INDEX.md')).toBe(`${IDEAS_INDEX}| [c.md](c.md) | plan | A channel on AI tools. |\n`)
    expect(made).toContain('ideas/INDEX.md: a line for c.md')
  })

  test('with no type and no In short line, the type comes from the shelf and the summary from the first sentence', () => {
    write('docs/wiki/resources/systems/shipments-api.md', '# Shipments API\n\nThe list filters by status. It sorts the newest first.\n')
    new Wiki(root, WikiConfig.from(SECTION)).fix()
    expect(read('docs/wiki/resources/INDEX.md')).toBe(
      '# Resources\n\nKnowledge to look up.\n\n| Page | Type | Summary |\n|---|---|---|\n| [systems/shipments-api.md](systems/shipments-api.md) | resource | The list filters by status. |\n',
    )
  })

  test('makes the top index with one line for each shelf, and makes no index in a shelf with no index', () => {
    new Wiki(root, WikiConfig.from(SECTION)).fix()
    expect(read('docs/wiki/INDEX.md')).toBe(
      '# Wiki\n\nOne shelf for each kind of page. Each shelf keeps its own index.\n\n| Shelf | Use |\n|---|---|\n| [ideas](ideas/INDEX.md) | An idea that has not started. |\n| [resources](resources/INDEX.md) | Knowledge to look up. |\n| daily | One note for each day. |\n',
    )
    expect(existsSync(join(root, 'docs/wiki/daily/INDEX.md'))).toBe(false)
  })

  test('removes no line, also for a page that is gone', () => {
    write('docs/wiki/ideas/INDEX.md', IDEAS_INDEX)
    write('docs/wiki/ideas/a.md', '# A\n')
    new Wiki(root, WikiConfig.from(SECTION)).fix()
    expect(read('docs/wiki/ideas/INDEX.md')).toBe(IDEAS_INDEX)
  })
})

describe('Wiki.links', () => {
  test('names a [[link]] or a Markdown link to a page that does not exist', () => {
    write('docs/wiki/ideas/a.md', 'See [[shipments-api]] and [[gone]], and [the c page](c.md) and [x](missing.md) and [web](https://x.y/z.md).\n')
    write('docs/wiki/ideas/c.md', '# C\n')
    write('docs/wiki/resources/systems/shipments-api.md', '# S\n')
    expect(new Wiki(root, WikiConfig.from(SECTION)).brokenLinks()).toEqual([
      { page: 'ideas/a.md', link: '[[gone]]' },
      { page: 'ideas/a.md', link: 'missing.md' },
    ])
  })
})

describe('Wiki.drafts', () => {
  test('lists the drafts that wait for the yes of the owner, and a link to a draft is not a page yet', () => {
    write('docs/wiki/drafts/resources/shipments-page.md', '# Shipments page\n')
    write('docs/wiki/drafts/ideas/export.md', '# Export\n')
    write('docs/wiki/ideas/a.md', 'See [[shipments-page]].\n')
    const wiki = new Wiki(root, WikiConfig.from(SECTION))
    expect(wiki.drafts()).toEqual(['ideas/export.md', 'resources/shipments-page.md'])
    expect(wiki.brokenLinks()).toEqual([{ page: 'ideas/a.md', link: '[[shipments-page]]' }])
  })

  test('a wiki with no drafts folder has no drafts', () => {
    expect(new Wiki(root, WikiConfig.from(SECTION)).drafts()).toEqual([])
  })
})

describe('Wiki.retire', () => {
  const setup = () => {
    write('docs/wiki/resources/INDEX.md', '# Resources\n\n| Page | Type | Summary |\n|---|---|---|\n| [cart.md](cart.md) | system | The cart. |\n| [pay.md](pay.md) | system | The payment. |\n| [checkout.md](checkout.md) | system | The whole checkout. |\n')
    write('docs/wiki/resources/cart.md', '# Cart\n')
    write('docs/wiki/resources/pay.md', '# Pay\n')
    write('docs/wiki/resources/checkout.md', '# Checkout\n\nFrom [[cart]] to [[pay]].\n')
    write('docs/wiki/ideas/next.md', 'See [the cart](../resources/cart.md) and [[pay]].\n')
    return new Wiki(root, WikiConfig.from(SECTION))
  }

  test('moves the old pages into the archive under the date, and takes their rows out of the index', () => {
    setup().retire(['resources/cart.md', 'resources/pay.md'], 'resources/checkout.md', '2026-10-16')
    expect(existsSync(join(root, 'archive/wiki/2026-10-16/resources/cart.md'))).toBe(true)
    expect(existsSync(join(root, 'docs/wiki/resources/pay.md'))).toBe(false)
    expect(read('docs/wiki/resources/INDEX.md')).toBe('# Resources\n\n| Page | Type | Summary |\n|---|---|---|\n| [checkout.md](checkout.md) | system | The whole checkout. |\n')
  })

  test('points each link to an old page at the combined page', () => {
    setup().retire(['resources/cart.md', 'resources/pay.md'], 'resources/checkout.md', '2026-10-16')
    expect(read('docs/wiki/ideas/next.md')).toBe('See [the cart](../resources/checkout.md) and [[checkout]].\n')
    expect(read('docs/wiki/resources/checkout.md')).toBe('# Checkout\n\nFrom [[checkout]] to [[checkout]].\n')
  })

  test('a page in a folder of a shelf leaves the index of its shelf', () => {
    write('docs/wiki/resources/INDEX.md', '| Page | Type | Summary |\n|---|---|---|\n| [systems/old.md](systems/old.md) | system | Old. |\n| [all.md](all.md) | system | All. |\n')
    write('docs/wiki/resources/systems/old.md', '# Old\n')
    write('docs/wiki/resources/all.md', '# All\n')
    new Wiki(root, WikiConfig.from(SECTION)).retire(['resources/systems/old.md'], 'resources/all.md', '2026-10-16')
    expect(read('docs/wiki/resources/INDEX.md')).toBe('| Page | Type | Summary |\n|---|---|---|\n| [all.md](all.md) | system | All. |\n')
  })

  test('refuses a combined page that does not exist yet, and moves nothing', () => {
    const wiki = setup()
    expect(() => wiki.retire(['resources/cart.md'], 'resources/order.md', '2026-10-16')).toThrow('resources/order.md does not exist')
    expect(existsSync(join(root, 'docs/wiki/resources/cart.md'))).toBe(true)
  })
})
