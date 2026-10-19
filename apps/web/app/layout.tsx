import { basename } from 'node:path'

import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { uiKit } from '@nook/desk/ui-kit.ts'

import { AreaTones } from '@/components/Areas.tsx'
import { Live } from '@/components/Live.tsx'
import { Owner, ViewerNote } from '@/components/Owner.tsx'
import { PackNav } from '@/components/PackNav.tsx'
import { deskAreas, deskDir, packTabs } from '@/lib/desk.ts'
import { OWNER_HEADER } from '@/lib/gate.ts'
import '@/app/globals.css'
import '@/app/app.css'

export const dynamic = 'force-dynamic'

/**
 * The shell of each page: the Bench tokens and styles, the desk name and the pack tabs; the Bench script draws the
 * diagrams. The gate says if the browser is paired, and the owner moves below follow it.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const desk = deskDir()
  const paired = (await headers()).get(OWNER_HEADER) === '1'
  const kit = uiKit()
  return (
    <html lang="en">
      <head>
        <title>{`Nook · ${basename(desk)}`}</title>
        <style dangerouslySetInnerHTML={{ __html: kit.css }} />
      </head>
      <body className="bn-root">
        <header className="nk-top">
          <span className="nk-top__desk">{basename(desk)}</span>
          <PackNav tabs={packTabs(desk)} />
          <form className="nk-search" action="/search" method="get" role="search">
            <input className="bn-input" type="search" name="q" placeholder="Search the desk" aria-label="Search the desk" />
          </form>
        </header>
        <Owner paired={paired}>
          <ViewerNote />
          <AreaTones names={deskAreas()}>
            <main className="nk-main">{children}</main>
          </AreaTones>
        </Owner>
        <Live />
        <script dangerouslySetInnerHTML={{ __html: kit.js }} />
      </body>
    </html>
  )
}
