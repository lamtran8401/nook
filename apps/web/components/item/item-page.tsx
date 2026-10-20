import type { ItemDocs, ItemView } from '@nook/engineering/read/reader.ts'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'

import { DocTab, type DocName } from '@/components/item/doc-tab.tsx'
import { ItemHeader } from '@/components/item/item-header.tsx'
import { Overview } from '@/components/item/overview.tsx'

export const ITEM_TABS = ['overview', 'spec', 'plan', 'tasks', 'walkthrough'] as const
export type ItemTab = (typeof ITEM_TABS)[number]

const label = (tab: ItemTab) => tab.charAt(0).toUpperCase() + tab.slice(1)

/** The tab of a query such as `?tab=plan`; an unknown tab is the Overview. */
export const tabOf = (value: unknown): ItemTab => (ITEM_TABS as readonly unknown[]).includes(value) ? (value as ItemTab) : 'overview'

/** The full page of an item: its head, the tabs, and the open tab. Each tab is its own address, so a reload keeps it. */
export function ItemPage({ view, docs, tab, now, base }: { view: ItemView; docs: ItemDocs; tab: ItemTab; now: Date; base: string }) {
  const { item } = view
  const tabs = ITEM_TABS.map(name => ({ href: name === 'overview' ? `${base}/works/${item.id}` : `${base}/works/${item.id}?tab=${name}`, label: label(name), current: name === tab }))
  return (
    <div className="mx-auto grid w-full max-w-[920px] gap-5">
      <ItemHeader view={view} base={base} />
      <div className="sticky top-3 z-30 flex justify-center">
        <LinkTabs label="Item" variant="bar" tabs={tabs} />
      </div>
      {tab === 'overview' ? <Overview view={view} now={now} /> : <DocTab id={item.id} name={tab as DocName} text={docs[tab]} areas={item.areas} criteria={view.criteria} slices={view.slices} />}
    </div>
  )
}
