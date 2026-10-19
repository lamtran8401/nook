'use client'

import { usePathname } from 'next/navigation'

import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'

export type Tab = { href: string; label: string }

/** The tab of a page: its own address, or the address of a page above it; Home marks only itself. */
export const isCurrentTab = (path: string, href: string) => path === href || (href !== '/' && path.startsWith(`${href}/`))

/** The pack tabs, the tab of the current page marked. */
export function PackNav({ tabs }: { tabs: Tab[] }) {
  const path = usePathname()
  return <LinkTabs label="Packs" tabs={tabs.map(tab => ({ ...tab, current: isCurrentTab(path, tab.href) }))} />
}
