import type { ItemDocs, ItemView } from '@nook/engineering/read/reader.ts'
import { LinkTabs } from '@nook/ui/components/link-tabs.tsx'

import { DocTab } from '@/components/item/doc-tab.tsx'
import { ItemAside, tabHref } from '@/components/item/item-aside.tsx'
import { ItemHead } from '@/components/item/item-head.tsx'
import { Overview } from '@/components/item/overview.tsx'
import { Timeline } from '@/components/item/timeline.tsx'

/** The tabs of an item: the overview, a tab for each document of its kind, and the activity. */
export const tabsOf = (docs: ItemDocs): string[] => ['overview', ...docs.map(doc => doc.name), 'activity']

/** The tab of a query such as `?tab=plan`; a tab that the kind does not have is the overview. */
export const tabOf = (value: unknown, docs: ItemDocs): string => (typeof value === 'string' && tabsOf(docs).includes(value) ? value : 'overview')

/** The full page of an item: its head, the tabs of its kind, the open tab, and its side. Each tab has its own address, so a reload keeps it. */
export function ItemPage({ view, docs, tab, now, base }: { view: ItemView; docs: ItemDocs; tab: string; now: Date; base: string }) {
  const { item } = view
  const doc = docs.find(d => d.name === tab)
  const tabs = tabsOf(docs).map(name => ({ href: tabHref(base, item.id, name), label: name.replace('-', ' '), current: name === tab }))
  return (
    <div className="grid w-full gap-4">
      <ItemHead view={view} />
      <div className="sticky top-3 z-30 flex justify-center">
        <LinkTabs label="Item" variant="bar" tabs={tabs} />
      </div>
      <div className="grid items-start gap-3 min-[1100px]:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid min-w-0 gap-3">
          {doc ? (
            <DocTab id={item.id} name={doc.name} text={doc.text} areas={item.areas} criteria={view.criteria} slices={view.slices} />
          ) : tab === 'activity' ? (
            <Timeline events={view.events} />
          ) : (
            <Overview view={view} now={now} />
          )}
        </div>
        <ItemAside view={view} docs={docs} tab={tab} now={now} base={base} />
      </div>
    </div>
  )
}
