import { describe, expect, test } from 'bun:test'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { AppRail } from '@nook/ui/components/app-rail.tsx'
import { AppShell } from '@nook/ui/components/app-shell.tsx'
import { IconCard } from '@nook/ui/components/icon-card.tsx'
import { PageHeader } from '@nook/ui/components/page-header.tsx'
import { SectionHeader } from '@nook/ui/components/section-header.tsx'
import { SideNav } from '@nook/ui/components/side-nav.tsx'

const html = (node: ReactElement) => renderToStaticMarkup(node)
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const DESKS = [
  { name: 'personal', href: '/personal', tone: 'primary', active: true },
  { name: 'chorus', href: '/chorus', tone: 'violet', active: false },
]

describe('AppRail', () => {
  test('shows one tile for each desk with the first two letters of its name in its tone, and marks the open desk', () => {
    const rail = html(<AppRail desks={DESKS} />)
    expect([...rail.matchAll(/<a [^>]*href="(\/\w+)"[^>]*>/g)].map(m => m[1])).toEqual(['/personal', '/chorus'])
    expect(rail).toContain('aria-label="personal" aria-current="page"')
    expect(rail).toContain('aria-label="chorus"')
    expect(rail).not.toContain('aria-label="chorus" aria-current')
    expect(text(rail)).toBe('N PE CH')
  })
})

describe('SideNav', () => {
  test('lists its pages with their icons and counts, marks the open page, and keeps its footer at the end', () => {
    const nav = html(
      <SideNav
        title="personal"
        search={<input aria-label="Search" />}
        items={[
          { label: 'Home', href: '/personal', icon: <i />, active: false },
          { label: 'Works', href: '/personal/works', icon: <i />, count: 6, active: true },
        ]}
        footer={[{ label: 'Settings', href: '/personal/settings', icon: <i />, active: false }]}
      />,
    )
    expect(nav).toContain('href="/personal/works" aria-current="page"')
    expect(text(nav)).toBe('personal Home Works 6 Settings')
    expect(nav.indexOf('aria-label="Search"')).toBeLessThan(nav.indexOf('Home'))
  })
})

describe('PageHeader and SectionHeader', () => {
  test('a page header has the title and its one line; a section header has its title, its count and its tools', () => {
    expect(html(<PageHeader title="Works" description="The items of personal, in the order of the flow." />)).toMatch(/<h1[^>]*>Works<\/h1><p[^>]*>The items of personal, in the order of the flow\.<\/p>/)
    const section = html(<SectionHeader title="Items" count={6}><button>Kind</button></SectionHeader>)
    expect(text(section)).toBe('Items 6 Kind')
    expect(section).toContain('<h2')
  })
})

describe('IconCard', () => {
  test('a card with an address is one link: the tile in its tone, the title, two lines, the tags and the part on the right', () => {
    const card = html(<IconCard href="/personal/works/SHOP-42" icon={<i />} tone="danger" title="Pay with a saved card" description="The api charges a saved card." tags={['api', 'web', 'M']} meta="SHOP-42" />)
    expect(card).toStartWith('<a data-slot="icon-card" href="/personal/works/SHOP-42"')
    expect(card).toContain('data-slot="icon-tile" data-tone="danger"')
    expect(text(card)).toBe('Pay with a saved card SHOP-42 The api charges a saved card. api web M')
  })

  test('a card with no address is an article', () => {
    expect(html(<IconCard icon={<i />} title="scout" />)).toStartWith('<article data-slot="icon-card"')
  })
})

describe('AppShell', () => {
  test('puts the rail and the side nav beside the page, and folds them into a menu for a narrow page', () => {
    const shell = html(<AppShell rail={<nav>rail</nav>} nav={<nav>pages</nav>}><p>the page</p></AppShell>)
    expect(shell).toContain('<details data-slot="shell-menu"')
    expect(shell).toContain('<summary')
    expect(text(shell)).toBe('Menu rail pages rail pages the page')
  })
})
