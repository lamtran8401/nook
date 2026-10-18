import type { ItemDocs, ItemView } from '@nook/engineering/read/reader.ts'

import { ItemHeader } from './ItemHeader.tsx'
import { DocTab, type DocName } from './DocTab.tsx'
import { Overview } from './Overview.tsx'

export const ITEM_TABS = ['overview', 'spec', 'plan', 'tasks', 'walkthrough'] as const
export type ItemTab = (typeof ITEM_TABS)[number]

const label = (tab: ItemTab) => tab.charAt(0).toUpperCase() + tab.slice(1)

/** The tab of a query such as `?tab=plan`; an unknown tab is the Overview. */
export const tabOf = (value: unknown): ItemTab => (ITEM_TABS as readonly unknown[]).includes(value) ? (value as ItemTab) : 'overview'

function Tabs({ id, open }: { id: string; open: ItemTab }) {
  return (
    <nav className="bn-tabs__bar nk-itemtabs" aria-label="Item">
      <div className="bn-tabs__list" role="tablist">
        {ITEM_TABS.map(tab => (
          <a key={tab} className="bn-tabs__tab" role="tab" aria-selected={tab === open} href={tab === 'overview' ? `/works/${id}` : `/works/${id}?tab=${tab}`}>
            {label(tab)}
          </a>
        ))}
      </div>
    </nav>
  )
}

/** The full page of an item: its head, the tabs, and the open tab. Each tab is its own address, so a reload keeps it. */
export function ItemPage({ view, docs, tab, now }: { view: ItemView; docs: ItemDocs; tab: ItemTab; now: Date }) {
  const { item } = view
  return (
    <div className="nk-item">
      <ItemHeader view={view} />
      <Tabs id={item.id} open={tab} />
      {tab === 'overview' ? <Overview view={view} now={now} /> : <DocTab id={item.id} name={tab as DocName} text={docs[tab]} areas={item.areas} criteria={view.criteria} />}
    </div>
  )
}
