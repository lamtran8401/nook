'use client'

import { BookOpen, GraduationCap, House, LayoutGrid } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { Input } from '@nook/ui/components/input.tsx'
import { SideNav } from '@nook/ui/components/side-nav.tsx'

/** One page of the side nav: its key for the icon, its label, its address and a count when it has one. */
export type NavPage = { key: string; label: string; href: string; count?: number }

const ICONS: Record<string, ReactNode> = {
  home: <House aria-hidden="true" />,
  works: <LayoutGrid aria-hidden="true" />,
  wiki: <BookOpen aria-hidden="true" />,
  learn: <GraduationCap aria-hidden="true" />,
}

/** The page of an address: its own address, or one above it; the home of a desk marks only itself. */
export const isCurrentPage = (path: string, href: string, home: string) => path === href || (href !== home && path.startsWith(`${href}/`))

/** The side nav of a desk: its name, the search of the desk, and its pages, the current one marked. */
export function DeskNav({ title, base, pages }: { title: string; base: string; pages: NavPage[] }) {
  const path = usePathname() ?? ''
  const search = (
    <form action={`${base}/search`} method="get" role="search">
      <Input type="search" name="q" placeholder="Search the desk" aria-label="Search the desk" />
    </form>
  )
  const items = pages.map(page => ({ label: page.label, href: page.href, icon: ICONS[page.key], active: isCurrentPage(path, page.href, base), ...(page.count === undefined ? {} : { count: page.count }) }))
  return <SideNav title={title} search={search} items={items} />
}
