'use client'

import { BarChart3, BookOpen, Bot, GraduationCap, House, LayoutGrid, ScrollText, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { SidebarToggle } from '@nook/ui/components/app-shell.tsx'
import { openCommandMenu } from '@nook/ui/components/command-menu.tsx'
import { DeskMenu, type MenuDesk } from '@nook/ui/components/desk-menu.tsx'
import { Kbd } from '@nook/ui/components/kbd.tsx'
import { SideNav } from '@nook/ui/components/side-nav.tsx'

/** One page of the side nav: its key for the icon, its label, its address and a count when it has one. */
export type NavPage = { key: string; label: string; href: string; count?: number; footer?: boolean }

const ICONS: Record<string, ReactNode> = {
  home: <House aria-hidden="true" />,
  works: <LayoutGrid aria-hidden="true" />,
  wiki: <BookOpen aria-hidden="true" />,
  learn: <GraduationCap aria-hidden="true" />,
  metrics: <BarChart3 aria-hidden="true" />,
  agents: <Bot aria-hidden="true" />,
  events: <ScrollText aria-hidden="true" />,
  settings: <Settings aria-hidden="true" />,
}

/** The page of an address: its own address, or one above it; the home of a desk marks only itself. */
export const isCurrentPage = (path: string, href: string, home: string) => path === href || (href !== home && path.startsWith(`${href}/`))

/** The sidebar of a desk: the desk menu, the button of ⌘K, and the pages, the current one marked. */
export function DeskNav({ desks, base, pages }: { desks: MenuDesk[]; base: string; pages: NavPage[] }) {
  const path = usePathname() ?? ''
  const search = (
    <button type="button" onClick={openCommandMenu} className="flex w-full items-center justify-between rounded-full bg-surface py-1.5 pr-1.5 pl-3.5 text-left text-sm text-muted-foreground shadow-xs">
      Search or run… <Kbd>⌘K</Kbd>
    </button>
  )
  const item = (page: NavPage) => ({ label: page.label, href: page.href, icon: ICONS[page.key], active: isCurrentPage(path, page.href, base), ...(page.count === undefined ? {} : { count: page.count }) })
  return (
    <SideNav
      head={
        <>
          <DeskMenu desks={desks} />
          <SidebarToggle />
        </>
      }
      search={search}
      items={pages.filter(p => !p.footer).map(item)}
      footer={pages.filter(p => p.footer).map(item)}
    />
  )
}

/** The place of the page in the top bar: the desk, the page, and the item when the page shows one. */
export function PageCrumbs({ desk, base, pages }: { desk: string; base: string; pages: NavPage[] }) {
  const path = usePathname() ?? ''
  const page = pages.find(p => isCurrentPage(path, p.href, base))
  const rest = page && path.startsWith(`${page.href}/`) ? decodeURIComponent(path.slice(page.href.length + 1).split('/')[0] ?? '') : ''
  return (
    <nav aria-label="Where you are" className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
      <span className="truncate">{desk}</span>
      {page ? (
        <>
          <span aria-hidden="true">/</span>
          {rest ? <a href={page.href} className="hover:text-foreground">{page.label}</a> : <span className="font-medium text-foreground">{page.label}</span>}
        </>
      ) : null}
      {rest ? (
        <>
          <span aria-hidden="true">/</span>
          <span className="truncate font-medium text-foreground">{rest}</span>
        </>
      ) : null}
    </nav>
  )
}
