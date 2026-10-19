'use client'

import { usePathname } from 'next/navigation'

import { type Tab, TabLinks } from '@/components/TabLinks.tsx'

/** The pack tabs with the tab of the current page marked. */
export function PackNav({ tabs }: { tabs: Tab[] }) {
  return <TabLinks tabs={tabs} current={usePathname()} />
}
