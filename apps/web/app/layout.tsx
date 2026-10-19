import { basename } from 'node:path'

import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { uiKit } from '@nook/desk/ui-kit.ts'
import { Input } from '@nook/ui/components/input.tsx'

import { AreaTones } from '@/components/areas.tsx'
import { Live } from '@/components/live.tsx'
import { Owner, ViewerNote } from '@/components/owner.tsx'
import { PackNav } from '@/components/pack-nav.tsx'
import { deskAreas, deskDir, packTabs } from '@/lib/desk.ts'
import { OWNER_HEADER } from '@/lib/gate.ts'
import '@nook/ui/styles/globals.css'

export const dynamic = 'force-dynamic'

/**
 * The shell of each page: the Bench tokens, the desk name, the pack tabs and the search; the Bench script draws the
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
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-hairline bg-background/85 px-4 py-3 backdrop-blur-md">
          <span className="text-[15px] font-semibold">{basename(desk)}</span>
          <PackNav tabs={packTabs(desk)} />
          <form className="order-3 w-full sm:order-none sm:ml-auto sm:w-72" action="/search" method="get" role="search">
            <Input type="search" name="q" placeholder="Search the desk" aria-label="Search the desk" />
          </form>
        </header>
        <Owner paired={paired}>
          <ViewerNote />
          <AreaTones names={deskAreas()}>
            <main className="mx-auto grid w-full max-w-[1120px] gap-5 px-4 pt-5 pb-16 has-[>[data-wide]]:max-w-none">{children}</main>
          </AreaTones>
        </Owner>
        <Live />
        <script dangerouslySetInnerHTML={{ __html: kit.js }} />
      </body>
    </html>
  )
}
