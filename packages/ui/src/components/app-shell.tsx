'use client'

import { PanelLeft } from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'

import { cn } from '@nook/ui/lib/utils.ts'

const SIDE_KEY = 'nook-side'
const NARROW = '(max-width: 859px)'

const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
const remembered = (): boolean => {
  try {
    return localStorage.getItem(SIDE_KEY) === 'hidden'
  } catch {
    return false
  }
}
const remember = (hidden: boolean) => {
  try {
    localStorage.setItem(SIDE_KEY, hidden ? 'hidden' : 'docked')
  } catch {
    // a browser with no storage keeps the choice for this page only
  }
}

const SidebarContext = createContext<{ floating: boolean; toggle: () => void }>({ floating: false, toggle: () => {} })

/** The button of the sidebar that hides it, or docks it again, the same as the key `[`. */
export function SidebarToggle() {
  const { floating, toggle } = useContext(SidebarContext)
  const label = floating ? 'Dock the sidebar' : 'Hide the sidebar'
  return (
    <button type="button" aria-label={label} title={`${label}  [`} onClick={toggle} className="grid size-[30px] shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
      <PanelLeft className="size-4" aria-hidden="true" />
    </button>
  )
}

/**
 * The frame of the app: the sidebar and the page. The sidebar docks in its column, or hides with `[` and then floats
 * over the page as thick glass when the pointer reaches the left edge; a page under 860 px always floats it. The top
 * bar of the page turns to glass once the page scrolls under it.
 */
export function AppShell({ sidebar, top, children }: { sidebar: ReactNode; top?: ReactNode; children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [peek, setPeek] = useState(false)
  const [stuck, setStuck] = useState(false)
  const loaded = useRef(false)
  const floating = hidden || narrow

  useEffect(() => {
    setHidden(remembered())
    const media = matchMedia(NARROW)
    const fit = () => setNarrow(media.matches)
    const scroll = () => setStuck(window.scrollY > 4)
    const key = (event: KeyboardEvent) => {
      if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return
      setHidden(was => !was)
      setPeek(false)
    }
    fit()
    media.addEventListener('change', fit)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      media.removeEventListener('change', fit)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('keydown', key)
    }
  }, [])

  useEffect(() => {
    if (loaded.current) remember(hidden)
    loaded.current = true
  }, [hidden])

  // a menu of the sidebar opens in a portal, so the pointer that leaves for it does not close the sidebar
  const leave = () => !narrow && !document.querySelector('[data-slot=menu-content]') && setPeek(false)

  const toggle = () => {
    setHidden(was => !was)
    setPeek(false)
  }

  return (
    <SidebarContext.Provider value={{ floating, toggle }}>
    <div data-slot="app-shell" data-side={floating ? 'hidden' : 'docked'} className={cn('grid min-h-dvh bg-background', floating ? 'grid-cols-[0_minmax(0,1fr)]' : 'grid-cols-[236px_minmax(0,1fr)]')}>
      {floating ? <div aria-hidden="true" className="fixed inset-y-0 left-0 z-30 w-2.5" onMouseEnter={() => setPeek(true)} /> : null}
      {floating && peek && narrow ? <div aria-hidden="true" className="fixed inset-0 z-30 bg-[var(--scrim)]" onClick={() => setPeek(false)} /> : null}
      <aside
        data-slot="sidebar"
        onMouseLeave={leave}
        className={cn(
          'z-40',
          floating
            ? 'fixed top-2 bottom-2 left-2 w-[228px] overflow-hidden rounded-[14px] bg-[var(--glass-strong)] shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-transform duration-200 motion-reduce:transition-none'
            : 'sticky top-0 h-dvh',
          floating && !peek && '-translate-x-[calc(100%+16px)]',
        )}
      >
        {sidebar}
      </aside>
      <main className="col-start-2 min-w-0 px-4 pb-16 min-[860px]:px-7">
        <div
          data-slot="top-bar"
          data-stuck={stuck}
          className="sticky top-0 z-20 -mx-4 mb-1 flex min-h-[52px] items-center gap-2.5 bg-background px-4 transition-[background-color,box-shadow] min-[860px]:-mx-7 min-[860px]:px-7 data-[stuck=true]:bg-[var(--glass)] data-[stuck=true]:shadow-[0_1px_0_var(--hairline),0_6px_16px_-10px_oklch(0.2_0.01_260/0.2)] data-[stuck=true]:backdrop-blur-md"
        >
          {floating ? (
            <button type="button" aria-label="Show the sidebar" title="Show the sidebar  [" onClick={() => setPeek(was => !was)} className="grid size-[30px] place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <PanelLeft className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          {top}
        </div>
        {children}
      </main>
    </div>
    </SidebarContext.Provider>
  )
}
