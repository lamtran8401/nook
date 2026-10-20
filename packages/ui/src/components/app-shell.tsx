import type { ReactNode } from 'react'

/**
 * The frame of the app: the rail and the side nav beside the page. Below 900 px they fold into a menu that opens with a
 * plain details element, so it needs no script.
 */
export function AppShell({ rail, nav, children }: { rail: ReactNode; nav: ReactNode; children: ReactNode }) {
  return (
    <div data-slot="app-shell" className="flex min-h-dvh bg-background">
      <details data-slot="shell-menu" className="group fixed top-3 left-3 z-50 min-[900px]:hidden">
        <summary className="cursor-pointer list-none rounded-full bg-card px-3.5 py-1.5 text-sm font-medium shadow-[var(--shadow-1)]">Menu</summary>
        <div className="mt-2 flex max-h-[80dvh] overflow-hidden rounded-[18px] shadow-[var(--shadow-2)]">
          {rail}
          {nav}
        </div>
      </details>
      <div className="sticky top-0 hidden h-dvh max-[899px]:hidden min-[900px]:flex">
        {rail}
        {nav}
      </div>
      <main className="min-w-0 flex-1 px-4 pt-14 pb-16 min-[900px]:px-8 min-[900px]:pt-7">{children}</main>
    </div>
  )
}
