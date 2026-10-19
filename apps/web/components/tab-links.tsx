export type Tab = { href: string; label: string }

/** The pack tabs; the tab of the current page, or of a page under it, is marked. */
export function TabLinks({ tabs, current }: { tabs: Tab[]; current: string }) {
  const isCurrent = (href: string) => current === href || (href !== '/' && current.startsWith(`${href}/`))
  return (
    <nav className="nk-tabs" aria-label="Packs">
      {tabs.map(tab => (
        <a href={tab.href} key={tab.href} aria-current={isCurrent(tab.href) ? 'page' : undefined}>
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
